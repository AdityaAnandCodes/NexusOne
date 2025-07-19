import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Get all users
    const users = await db.collection("users").find({}).toArray();

    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    await client.close();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        companyId: u.companyId,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      totalUsers: users.length,
      collections: collectionNames,
      debug: true,
    });
  } catch (error) {
    console.error("Error in debug db endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
