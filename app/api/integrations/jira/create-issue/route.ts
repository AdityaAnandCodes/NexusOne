import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie);
    const body = await request.json();
    const {
      siteId,
      projectKey,
      summary,
      description,
      issueType = "Task",
    } = body;

    const targetSiteId = siteId || userData.sites[0]?.id;

    if (!targetSiteId || !projectKey || !summary) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const issueData = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description || "",
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`
      );
    }

    const newIssue = await response.json();
    return NextResponse.json(newIssue);
  } catch (error: any) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create issue" },
      { status: 500 }
    );
  }
}
