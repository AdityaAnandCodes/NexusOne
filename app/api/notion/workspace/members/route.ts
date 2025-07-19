// api/notion/workspace/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";

interface AuthData {
  access_token: string;
  workspace_name: string;
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

    // Get workspace users
    const users = await notion.users.list({
      page_size: 100,
    });

    const members = users.results.map((user: any) => ({
      id: user.id,
      name: user.name || user.email || "Unknown User",
      email: user.person?.email || "No email",
      type: user.type || "person",
      avatar_url: user.avatar_url,
    }));

    return NextResponse.json({
      success: true,
      members: members,
    });
  } catch (error) {
    console.error("Get workspace members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace members" },
      { status: 500 }
    );
  }
}
