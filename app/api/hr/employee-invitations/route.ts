import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details to verify they are HR
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (
      !user ||
      !user.companyId ||
      !["hr_manager", "company_admin"].includes(user.role)
    ) {
      await client.close();
      return NextResponse.json(
        { error: "Unauthorized. Only HR managers can view invitations." },
        { status: 403 }
      );
    }

    await connectToMainDB();

    // Get all invitations for the company
    const invitations = await EmployeeInvitation.find({
      companyId: user.companyId,
    }).sort({ invitedAt: -1 });

    await client.close();

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching employee invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
