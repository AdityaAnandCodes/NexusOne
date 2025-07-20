import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const invitation = await db.collection("invitations").findOne({
      email: session.user.email,
      status: "pending",
    });

    await client.close();

    return NextResponse.json({
      hasInvitation: !!invitation,
      invitation: invitation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
