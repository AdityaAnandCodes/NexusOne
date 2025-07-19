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

    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Find user in all collections
    const userSearchResults: { [key: string]: any[] } = {};

    for (const collectionName of collectionNames) {
      try {
        const foundUsers = await db
          .collection(collectionName)
          .find({
            email: session.user.email,
          })
          .toArray();

        if (foundUsers.length > 0) {
          userSearchResults[collectionName] = foundUsers;
        }
      } catch (error: any) {
        // Skip collections that might not be queryable
        console.log(
          `Skipped collection ${collectionName}:`,
          error?.message || "Unknown error"
        );
      }
    }

    await client.close();

    return NextResponse.json({
      sessionEmail: session.user.email,
      collections: collectionNames,
      userSearchResults,
      debug: true,
    });
  } catch (error: any) {
    console.error("Error in debug API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
