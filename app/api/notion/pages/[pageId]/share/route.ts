// api/notion/pages/[pageId]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";

interface AuthData {
  access_token: string;
  workspace_name: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;
    const { pageId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, permission } = await request.json();

    if (!email || !permission) {
      return NextResponse.json(
        { error: "Email and permission are required" },
        { status: 400 }
      );
    }

    // Read token from file
    const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);
    const data = await fs.readFile(tokenFile, "utf-8");
    const authData: AuthData = JSON.parse(data);

    // Initialize Notion client
    const notion = new Client({
      auth: authData.access_token,
    });

    // Note: Direct page sharing via API is limited in Notion
    // You would typically need to:
    // 1. Get the page
    // 2. Update page properties if it supports sharing
    // 3. Or handle this through your own permission system

    try {
      // Verify the page exists and we have access
      const page = await notion.pages.retrieve({ page_id: pageId });

      // For now, return a simulated response
      // In a real implementation, you might store sharing info in your database
      return NextResponse.json({
        success: true,
        message:
          "Page sharing functionality requires additional setup. Consider using Notion's built-in sharing features.",
        shared_with: email,
        permission: permission,
        page_id: pageId,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Page not found or no access" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Share page error:", error);
    return NextResponse.json(
      { error: "Failed to share page" },
      { status: 500 }
    );
  }
}
