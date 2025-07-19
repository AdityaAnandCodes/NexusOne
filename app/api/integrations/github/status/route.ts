import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Types for the GitHub user data
interface GitHubUser {
  access_token: string;
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  [key: string]: any; // For other user properties
}

interface AuthenticatedUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface AuthResponse {
  authenticated: boolean;
  user?: AuthenticatedUserResponse;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userCookie = request.cookies.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const userData: GitHubUser = JSON.parse(userCookie.value);

    // Verify token is still valid
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${userData.access_token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // Token is invalid, clear cookie
      const res = NextResponse.json({ authenticated: false });
      res.cookies.delete("github_user");
      return res;
    }

    const authResponse: AuthResponse = {
      authenticated: true,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
      },
    };

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Error checking GitHub auth status:", error);
    return NextResponse.json({ authenticated: false });
  }
}
