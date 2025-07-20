import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await request.json();

    // Validate role - allow frontend role names
    const validRoles = [
      "hr",
      "employee",
      "applicant",
      "super_admin",
      "company_admin",
      "hr_manager",
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Map frontend roles to database roles
    const roleMapping: { [key: string]: string } = {
      hr: "hr_manager",
      employee: "employee",
      applicant: "applicant",
      super_admin: "super_admin",
      company_admin: "company_admin",
      hr_manager: "hr_manager",
    };

    const dbRole = roleMapping[role] || role;

    console.log(`Setting role to: ${dbRole} for user: ${session.user.email}`);

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update data object
    const updateData: any = {
      role: dbRole,
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

    // For applicants, we don't need company association
    if (role === "applicant") {
      console.log(`Setting up applicant role - no company association needed`);
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
      role: dbRole,
    });
  } catch (error) {
    console.error("Error setting user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
