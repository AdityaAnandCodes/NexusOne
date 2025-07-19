import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Find user directly
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    await client.close();

    return NextResponse.json({
      sessionInfo: {
        email: session.user.email,
        name: session.user.name,
        id: (session as any).user?.id,
      },
      userFromDB: user
        ? {
            id: user._id,
            email: user.email,
            name: user.name,
            companyId: user.companyId,
            role: user.role,
          }
        : null,
      hasCompany: !!user?.companyId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
