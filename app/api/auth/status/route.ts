import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface AuthData {
  user: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  workspace_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;
    const isAuthenticated =
      request.cookies.get("notion_authenticated")?.value === "true";

    if (!userId || !isAuthenticated) {
      return NextResponse.json({ authenticated: false });
    }

    // Try to read user data from file
    const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);

    try {
      const data = await fs.readFile(tokenFile, "utf-8");
      const authData: AuthData = JSON.parse(data);

      return NextResponse.json({
        authenticated: true,
        user: authData.user,
        workspace_name: authData.workspace_name,
      });
    } catch (fileError) {
      // File doesn't exist or is corrupted
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
