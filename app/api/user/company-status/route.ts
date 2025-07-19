import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const sessionEmail = session.user.email;
    console.log("=== COMPANY STATUS CHECK ===");
    console.log("Session email:", sessionEmail);
    console.log("Session user ID:", (session as any).user?.id);

    // Check if user exists and has a company
    // First check in NextAuth users collection
    let user = await db.collection("users").findOne({
      email: sessionEmail,
    });

    console.log("Found user by email:", user ? "YES" : "NO");
    if (user) {
      console.log("User details:", {
        id: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
      });
    }

    await client.close();

    if (!user) {
      console.log("No user found");
      return NextResponse.json({
        hasCompany: false,
        needsOnboarding: true,
        debug: {
          searchedEmail: sessionEmail,
          foundUser: false,
        },
      });
    }

    // Check if user has a companyId
    const hasCompany = !!user.companyId;
    console.log("Final result - hasCompany:", hasCompany);

    return NextResponse.json({
      hasCompany,
      companyId: user.companyId || null,
      role: user.role || "employee",
      needsOnboarding: !hasCompany,
      debug: {
        searchedEmail: sessionEmail,
        foundUser: true,
        userHasCompanyId: hasCompany,
        userCompanyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("Error checking user company status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
