import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;

    if (userId) {
      // Delete the token file
      const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);
      try {
        await fs.unlink(tokenFile);
      } catch (error) {
        // File might not exist, which is fine
      }
    }

    // Create response and clear cookies
    const response = NextResponse.json({ success: true });

    response.cookies.set("notion_user_id", "", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
    });

    response.cookies.set("notion_authenticated", "", {
      path: "/",
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
