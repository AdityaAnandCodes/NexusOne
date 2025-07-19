import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    await connectToMainDB();

    // Get the invitation
    const invitation = await EmployeeInvitation.findOne({
      email: session.user.email,
      companyId: companyId,
      status: "pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "No valid invitation found" },
        { status: 404 }
      );
    }

    // Connect to MongoDB to update user
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update user with company info
    const updateResult = await db.collection("users").updateOne(
      { email: session.user.email },
      {
        $set: {
          companyId: companyId,
          role: invitation.role,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      await client.close();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mark invitation as accepted
    await EmployeeInvitation.findByIdAndUpdate(invitation._id, {
      status: "accepted",
      acceptedAt: new Date(),
    });

    await client.close();

    return NextResponse.json({
      success: true,
      message: "Employee onboarding completed successfully",
    });
  } catch (error) {
    console.error("Error completing employee onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
