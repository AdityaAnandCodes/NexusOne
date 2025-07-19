import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToMainDB } from '@/lib/mongodb'
import { EmployeeInvitation } from '@/lib/models/main'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email, companyId } = await request.json()
    
    if (!email || !companyId) {
      return NextResponse.json(
        { error: "Email and company ID are required" },
        { status: 400 }
      )
    }

    // Verify the email matches the session email
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403 }
      )
    }

    await connectToMainDB()

    // Check if there's a valid invitation for this email and company
    const invitation = await EmployeeInvitation.findOne({
      email: email,
      companyId: companyId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "No valid invitation found for this email and company. Please contact your HR manager." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation._id,
        role: invitation.role,
        department: invitation.department,
        position: invitation.position,
        invitedAt: invitation.invitedAt
      }
    })

  } catch (error) {
    console.error("Error verifying employee invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
