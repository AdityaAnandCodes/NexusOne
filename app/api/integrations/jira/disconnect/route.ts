import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore : any = cookies();

    // Clear all Jira-related cookies
    cookieStore.delete("jira_access_token");
    cookieStore.delete("jira_refresh_token");
    cookieStore.delete("jira_user_data");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Jira:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
