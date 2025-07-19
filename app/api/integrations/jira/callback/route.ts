import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://auth.atlassian.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: process.env.ATLASSIAN_CLIENT_ID,
          client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
          code: code,
          redirect_uri: `${
            new URL(request.url).origin
          }/api/integrations/jira/callback`,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(
        tokenData.error_description || "Failed to exchange code for token"
      );
    }

    // Get user info and accessible resources
    const [userResponse, resourcesResponse] = await Promise.all([
      fetch("https://api.atlassian.com/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      }),
      fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      }),
    ]);

    const userData = await userResponse.json();
    const resourcesData = await resourcesResponse.json();

    // Store tokens and user data (implement your storage logic)
    // For example, you might store in a database or secure session
    const cookieStore : any = cookies();
    cookieStore.set("jira_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in,
    });

    cookieStore.set("jira_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    cookieStore.set(
      "jira_user_data",
      JSON.stringify({
        user: userData,
        sites: resourcesData,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }
    );

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Jira OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }
}
