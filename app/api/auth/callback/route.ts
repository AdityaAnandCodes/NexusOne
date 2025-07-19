import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface TokenData {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
}

interface UserData {
  id: string;
  name: string;
  person?: {
    email: string;
  };
  type: string;
}

interface AuthData {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  user: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  created_at: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("Callback received:", { code: !!code, state, error }); // Debug log

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  if (!code) {
    console.error("No authorization code provided");
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData: TokenData = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    const userData: UserData = await userResponse.json();

    // Store the access token and user info
    const authData: AuthData = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      bot_id: tokenData.bot_id,
      workspace_id: tokenData.workspace_id,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.person?.email || "N/A",
        type: userData.type,
      },
      created_at: new Date().toISOString(),
    };

    // Save to file (in production, use a proper database)
    const tokensDir = path.join(process.cwd(), "tokens");

    try {
      await fs.access(tokensDir);
    } catch {
      await fs.mkdir(tokensDir, { recursive: true });
    }

    const tokenFile = path.join(tokensDir, `${userData.id}.json`);
    await fs.writeFile(tokenFile, JSON.stringify(authData, null, 2));

    console.log("Token saved successfully for user:", userData.name);

    // Create response and set cookies
    const response = NextResponse.redirect(
      new URL("/?success=true", request.url)
    );

    response.cookies.set("notion_user_id", userData.id, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });

    response.cookies.set("notion_authenticated", "true", {
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=server_error", request.url));
  }
}
