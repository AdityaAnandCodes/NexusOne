import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";

export const runtime = "nodejs";

// Replace your existing POST function logic with this:
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await request.json();

    console.log(`Setting role to: ${role} for user: ${session.user.email}`);

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update data object
    const updateData: any = {
      role: role,
      updatedAt: new Date(),
    };

    let hasCompany = false;

    // If setting as employee, check for invitation
    if (role === "employee") {
      try {
        await connectToMainDB();

        const invitation = await EmployeeInvitation.findOne({
          email: session.user.email,
          $or: [{ status: "pending" }, { status: { $exists: false } }],
        });

        console.log(`Found invitation:`, invitation ? "YES" : "NO");

        if (invitation) {
          console.log(`Invitation details:`, {
            companyId: invitation.companyId,
            role: invitation.role,
            department: invitation.department,
            position: invitation.position,
          });

          // Add company info to the user update
          updateData.companyId = invitation.companyId;
          updateData.department = invitation.department;
          updateData.position = invitation.position;

          hasCompany = true;

          // Mark invitation as accepted
          invitation.status = "accepted";
          invitation.acceptedAt = new Date();
          await invitation.save();

          console.log(`Invitation marked as accepted`);
        }
      } catch (invitationError) {
        console.error("Error processing invitation:", invitationError);
        // Continue without invitation - don't break the role setting
      }
    }

    console.log(`Updating user with data:`, updateData);

    const result = await db
      .collection("users")
      .updateOne({ email: session.user.email }, { $set: updateData });

    console.log(`Update result:`, result);

    await client.close();

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      hasCompany: hasCompany,
      role: role,
    });
  } catch (error) {
    console.error("Error setting user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
