// Create: /app/api/user/check-and-accept-invitation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();

    // Look for pending invitation for this user
    const invitation = await EmployeeInvitation.findOne({
      email: session.user.email,
      status: { $in: ["pending", undefined] }, // Include undefined for backward compatibility
    });

    if (!invitation) {
      return NextResponse.json({
        accepted: false,
        message: "No pending invitation found",
      });
    }

    // Connect to main database to update user
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update the user record with company information from invitation
    const userUpdateResult = await db.collection("users").updateOne(
      { email: session.user.email },
      {
        $set: {
          companyId: invitation.companyId,
          role: invitation.role || "employee",
          department: invitation.department,
          position: invitation.position,
          updatedAt: new Date(),
        },
      }
    );

    if (userUpdateResult.matchedCount === 0) {
      await client.close();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mark invitation as accepted
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();

    await client.close();

    return NextResponse.json({
      accepted: true,
      message: "Invitation accepted successfully",
      companyId: invitation.companyId,
      role: invitation.role,
    });
  } catch (error) {
    console.error("Error checking/accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
