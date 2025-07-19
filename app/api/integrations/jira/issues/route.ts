import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || userData.sites[0]?.id;
    const projectKey = searchParams.get("projectKey");
    const maxResults = searchParams.get("maxResults") || "50";

    if (!siteId) {
      return NextResponse.json({ error: "No site available" }, { status: 400 });
    }

    let jql = "order by created DESC";
    if (projectKey) {
      jql = `project = ${projectKey} ${jql}`;
    }

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${siteId}/rest/api/3/search?jql=${encodeURIComponent(
        jql
      )}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const issues = await response.json();
    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
