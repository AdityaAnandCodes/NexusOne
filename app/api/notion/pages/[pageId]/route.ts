// api/notion/pages/[pageId]/route.ts
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

    // Get page content
    const page = await notion.pages.retrieve({ page_id: pageId });

    // Get page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return NextResponse.json({
      success: true,
      page: page,
      blocks: blocks.results,
    });
  } catch (error) {
    console.error("Get page content error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page content" },
      { status: 500 }
    );
  }
}
