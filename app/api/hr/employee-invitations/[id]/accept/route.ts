import { NextRequest, NextResponse } from "next/server";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";
import { MongoClient, ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { invitationId, userEmail } = await request.json();

    if (!invitationId || !userEmail) {
      return NextResponse.json(
        { error: "Invitation ID and user email are required" },
        { status: 400 }
      );
    }

    await connectToMainDB();

    // Find the invitation
    const invitation = await EmployeeInvitation.findById(invitationId);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    if (invitation.email !== userEmail) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Invitation already accepted" },
        { status: 409 }
      );
    }

    // Connect to main database to update user
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update the user record with company information from invitation
    const userUpdateResult = await db.collection("users").updateOne(
      { email: userEmail },
      {
        $set: {
          companyId: invitation.companyId, // This is the key fix
          role: invitation.role,
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
      success: true,
      message: "Invitation accepted successfully",
      companyId: invitation.companyId,
      role: invitation.role,
      redirectTo: "/onboarding", // Explicitly tell frontend where to redirect
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
