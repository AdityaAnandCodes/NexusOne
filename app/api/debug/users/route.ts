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

    // Get all users with this email
    const users = await db
      .collection("users")
      .find({
        email: session.user.email,
      })
      .toArray();

    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    await client.close();

    return NextResponse.json({
      sessionUser: {
        email: session.user.email,
        id: (session as any).user?.id,
        name: session.user.name,
      },
      users: users,
      totalUsers: users.length,
      collections: collectionNames,
      debug: true,
    });
  } catch (error) {
    console.error("Error in debug users endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
