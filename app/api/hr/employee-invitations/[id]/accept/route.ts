import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeInvitation, User } from "@/lib/models/main";

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();
    
    const invitationId = params.id;
    
    // Find the invitation
    const invitation = await EmployeeInvitation.findById(invitationId);
    
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    // Verify the user email matches the invitation
    if (session.user.email !== invitation.email) {
      return NextResponse.json({ 
        error: "Email mismatch. Please sign in with the email the invitation was sent to." 
      }, { status: 403 });
    }

    // Find or create user
    let user = await User.findOne({ email: session.user.email });
    
    if (user) {
      // Update existing user with company information
      user.companyId = invitation.companyId;
      user.role = invitation.role;
      await user.save();
    } else {
      // Create new user
      user = new User({
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        image: session.user.image,
        companyId: invitation.companyId,
        role: invitation.role,
        isActive: true
      });
      await user.save();
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    console.log(`✅ Invitation accepted: ${session.user.email} joined company ${invitation.companyId} as ${invitation.role}`);

    return NextResponse.json({ 
      success: true, 
      message: "Invitation accepted successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
