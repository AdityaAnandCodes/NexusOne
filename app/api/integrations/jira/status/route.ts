import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore : any = cookies();
    const accessToken = cookieStore.get("jira_access_token")?.value;
    const userDataCookie = cookieStore.get("jira_user_data")?.value;

    if (!accessToken || !userDataCookie) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    const userData = JSON.parse(userDataCookie);

    return NextResponse.json({
      authenticated: true,
      user: {
        account_id: userData.user.account_id,
        name: userData.user.name,
        email: userData.user.email,
        picture: userData.user.picture,
      },
      sites: userData.sites.map((site: any) => ({
        id: site.id,
        name: site.name,
        url: site.url,
      })),
    });
  } catch (error) {
    console.error("Error checking Jira auth status:", error);
    return NextResponse.json({
      authenticated: false,
    });
  }
}
