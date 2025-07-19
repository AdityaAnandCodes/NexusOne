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
    const query = searchParams.get("query") || "";
    const maxResults = searchParams.get("maxResults") || "50";

    if (!siteId) {
      return NextResponse.json({ error: "No site available" }, { status: 400 });
    }

    let url = `https://api.atlassian.com/ex/jira/${siteId}/rest/api/3/groups/picker?maxResults=${maxResults}`;

    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const groups = await response.json();
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
