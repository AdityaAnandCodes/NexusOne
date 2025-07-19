import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";

interface AuthData {
  access_token: string;
  workspace_name: string;
}

interface NotionPage {
  id: string;
  properties?: {
    title?: {
      title?: Array<{
        plain_text?: string;
      }>;
    };
  };
  url: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;

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

    // Test API call - get pages
    const pages = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      page_size: 10,
    });

    return NextResponse.json({
      success: true,
      workspace: authData.workspace_name,
      pages: pages.results.map((page: NotionPage) => ({
        id: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || "Untitled",
        url: page.url,
      })),
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
