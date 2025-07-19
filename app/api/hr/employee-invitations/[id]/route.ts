import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation } from "@/lib/models/main";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has HR permissions
    await connectToMainDB();
    const { User } = await import("@/lib/models/main");

    const user = await User.findOne({ email: session.user.email });
    if (!user || !["hr_manager", "company_admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const invitationId = params.id;

    // Find and delete the invitation
    const invitation = await EmployeeInvitation.findById(invitationId);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify the invitation belongs to the user's company
    if (invitation.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this invitation" },
        { status: 403 }
      );
    }

    await EmployeeInvitation.findByIdAndDelete(invitationId);

    console.log(
      `🗑️ Invitation deleted: ${invitation.email} for company ${user.companyId}`
    );

    return NextResponse.json({
      success: true,
      message: "Invitation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();
    const { User } = await import("@/lib/models/main");

    const user = await User.findOne({ email: session.user.email });
    if (!user || !["hr_manager", "company_admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const invitationId = params.id;
    const invitation = await EmployeeInvitation.findById(invitationId);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify the invitation belongs to the user's company
    if (invitation.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized to view this invitation" },
        { status: 403 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
