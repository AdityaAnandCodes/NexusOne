import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie);
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId") || userData.sites[0]?.id;

    if (!siteId || !accountId) {
      return NextResponse.json(
        {
          error: "Site ID and Account ID are required",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${siteId}/rest/api/3/user?accountId=${accountId}`,
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

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
