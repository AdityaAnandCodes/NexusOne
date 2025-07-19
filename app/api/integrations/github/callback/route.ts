import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("GitHub callback received:", { code: !!code, state, error });

  if (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  // Only validate state if it was provided in the original request
  if (state) {
    const storedState = request.cookies.get("github_oauth_state")?.value;
    if (!storedState || state !== storedState) {
      console.error("State validation failed:", {
        provided: state,
        stored: storedState,
      });
      return NextResponse.redirect(
        new URL("/?error=state_mismatch", request.url)
      );
    }
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Token response:", { success: !tokenData.error });

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    if (!userResponse.ok) {
      throw new Error(`User request failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const emailData = await emailResponse.json();
    const primaryEmail =
      emailData.find((email: any) => email.primary)?.email || userData.email;

    const userInfo = {
      id: userData.id.toString(),
      login: userData.login,
      name: userData.name,
      email: primaryEmail,
      avatar_url: userData.avatar_url,
      access_token: tokenData.access_token,
    };

    const response = NextResponse.redirect(
      new URL("/?success=github_connected", request.url)
    );
    response.cookies.set("github_user", JSON.stringify(userInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear the state cookie
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (error) {
    console.error("GitHub OAuth processing error:", error);
    return NextResponse.redirect(
      new URL("/?error=oauth_processing_failed", request.url)
    );
  }
}
