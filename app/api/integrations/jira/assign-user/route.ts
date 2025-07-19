import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie);
    const body = await request.json();
    const { siteId, issueKey, accountId } = body;

    const targetSiteId = siteId || userData.sites[0]?.id;

    if (!targetSiteId || !issueKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const assignmentData = {
      accountId: accountId || null, // null to unassign
    };

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${targetSiteId}/rest/api/3/issue/${issueKey}/assignee`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`
      );
    }

    return NextResponse.json({ message: "User assigned successfully" });
  } catch (error: any) {
    console.error("Error assigning user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to assign user" },
      { status: 500 }
    );
  }
}
