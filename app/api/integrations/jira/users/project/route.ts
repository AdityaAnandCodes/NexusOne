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

    if (!siteId || !projectKey) {
      return NextResponse.json(
        {
          error: "Site ID and Project Key are required",
        },
        { status: 400 }
      );
    }

    // Get assignable users for a project
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${siteId}/rest/api/3/user/assignable/search?project=${projectKey}`,
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

    const users = await response.json();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching project users:", error);
    return NextResponse.json(
      { error: "Failed to fetch project users" },
      { status: 500 }
    );
  }
}
