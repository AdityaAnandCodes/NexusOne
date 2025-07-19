// api/notion/pages/[pageId]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";

interface AuthData {
  access_token: string;
  workspace_name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;
    const { pageId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Read token from file
    const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);
    const data = await fs.readFile(tokenFile, "utf-8");
    const authData: AuthData = JSON.parse(data);

    // Initialize Notion client
    const notion = new Client({
      auth: authData.access_token,
    });

    try {
      // Get page details to check if we have access
      const page = await notion.pages.retrieve({ page_id: pageId });

      // Note: Notion API has limited access to permission details
      // We can only get basic information about the page
      // For a full permissions system, you'd need to implement your own tracking

      return NextResponse.json({
        success: true,
        permissions: [
          {
            user_id: userId,
            user_name: "Current User",
            user_email: "current@user.com",
            permission: "write",
          },
        ],
        note: "Notion API has limited permission visibility. Consider implementing custom permission tracking.",
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Page not found or no access" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Get page permissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page permissions" },
      { status: 500 }
    );
  }
}
