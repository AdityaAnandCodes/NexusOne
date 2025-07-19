// api/notion/pages/route.ts
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
  properties?: any;
  url: string;
  created_time?: string;
  last_edited_time?: string;
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

    // Get pages
    const pages = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      page_size: 100,
    });

    const formattedPages = pages.results.map((page: any) => ({
      id: page.id,
      title: getPageTitle(page),
      url: page.url,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
    }));

    return NextResponse.json({
      success: true,
      pages: formattedPages,
    });
  } catch (error) {
    console.error("Get pages error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { title, content, parent_page_id } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Read token from file
    const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);
    const data = await fs.readFile(tokenFile, "utf-8");
    const authData: AuthData = JSON.parse(data);

    // Initialize Notion client
    const notion = new Client({
      auth: authData.access_token,
    });

    // Create page properties
    const pageData: any = {
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: [],
    };

    // Set parent (either workspace or specific page)
    if (parent_page_id) {
      pageData.parent = {
        type: "page_id",
        page_id: parent_page_id,
      };
    } else {
      pageData.parent = {
        type: "workspace",
        workspace: true,
      };
    }

    // Add content if provided
    if (content) {
      pageData.children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: content,
              },
            },
          ],
        },
      });
    }

    // Create the page
    const newPage = await notion.pages.create(pageData);

    return NextResponse.json({
      success: true,
      page: {
        id: newPage.id,
        title: title,
        url: newPage.url,
        created_time: newPage.created_time,
      },
    });
  } catch (error : any) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create page" },
      { status: 500 }
    );
  }
}

// Helper function to extract page title
function getPageTitle(page: any): string {
  if (page.properties?.title?.title?.[0]?.plain_text) {
    return page.properties.title.title[0].plain_text;
  }
  if (page.properties?.Name?.title?.[0]?.plain_text) {
    return page.properties.Name.title[0].plain_text;
  }
  // Try to get title from other properties
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === "title" && prop?.title?.[0]?.plain_text) {
      return prop.title[0].plain_text;
    }
  }
  return "Untitled";
}
