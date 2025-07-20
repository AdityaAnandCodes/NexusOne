// api/integrations/jira/create-issue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      console.log("❌ Jira authentication missing");
      return NextResponse.json(
        { error: "Not authenticated with Jira" },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userDataCookie);
    const body = await request.json();

    console.log("📝 Received Jira create-issue request:", body);

    const {
      siteId,
      projectKey,
      summary,
      description,
      issueType = "Task",
    } = body;

    // Validation with detailed error messages
    const validationErrors = [];

    if (!summary || summary.trim().length === 0) {
      validationErrors.push("Summary is required");
    }

    if (!projectKey || projectKey.trim().length === 0) {
      validationErrors.push("Project key is required");
    }

    if (validationErrors.length > 0) {
      console.log("❌ Validation errors:", validationErrors);
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: validationErrors,
          received: {
            summary: summary || "(empty)",
            projectKey: projectKey || "(empty)",
            description: description ? "provided" : "(empty)",
          },
        },
        { status: 400 }
      );
    }

    const targetSiteId = siteId || userData.sites?.[0]?.id;

    if (!targetSiteId) {
      console.log("❌ No Jira site available");
      return NextResponse.json(
        {
          error: "No Jira site available. Please reconnect your Jira account.",
        },
        { status: 400 }
      );
    }

    // Prepare issue data with proper format
    const issueData = {
      fields: {
        project: {
          key: projectKey.trim().toUpperCase(),
        },
        summary: summary.trim(),
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description?.trim() || summary.trim(),
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issueType,
        },
      },
    };

    console.log(
      "🚀 Creating Jira issue with data:",
      JSON.stringify(issueData, null, 2)
    );

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${targetSiteId}/rest/api/3/issue`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      }
    );

    const responseText = await response.text();
    console.log(`📊 Jira API Response Status: ${response.status}`);
    console.log(`📋 Jira API Response Body: ${responseText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      // Enhanced error handling with specific messages
      if (response.status === 400) {
        const errorMessages = errorData.errorMessages || [];
        const fieldErrors = errorData.errors || {};

        let detailedError = "Issue creation failed:";

        if (errorMessages.length > 0) {
          detailedError += ` ${errorMessages.join(", ")}`;
        }

        if (Object.keys(fieldErrors).length > 0) {
          const fieldErrorMessages = Object.entries(fieldErrors).map(
            ([field, error]) => `${field}: ${error}`
          );
          detailedError += ` Field errors: ${fieldErrorMessages.join(", ")}`;
        }

        if (fieldErrors.project) {
          detailedError += ` Please check if project "${projectKey}" exists and you have permission to create issues in it.`;
        }

        console.log("❌ Detailed Jira error:", detailedError);
        return NextResponse.json(
          {
            error: detailedError,
            jiraResponse: errorData,
          },
          { status: 400 }
        );
      }

      throw new Error(
        errorData.errorMessages?.[0] ||
          errorData.message ||
          `HTTP error! status: ${response.status}`
      );
    }

    const newIssue = JSON.parse(responseText);

    console.log("✅ Successfully created Jira issue:", {
      key: newIssue.key,
      id: newIssue.id,
      self: newIssue.self,
    });

    return NextResponse.json({
      success: true,
      issue: newIssue,
      key: newIssue.key,
      id: newIssue.id,
      self: newIssue.self,
    });
  } catch (error: any) {
    console.error("🚨 Error creating Jira issue:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create issue",
        details: "Please check your Jira connection and permissions",
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve projects for validation
export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie);
    const targetSiteId = userData.sites?.[0]?.id;

    if (!targetSiteId) {
      return NextResponse.json(
        { error: "No Jira site available" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${targetSiteId}/rest/api/3/project`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();

    return NextResponse.json({
      success: true,
      projects: projects.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching Jira projects:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
