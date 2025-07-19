import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToMainDB } from '@/lib/mongodb'
import { EmployeeInvitation } from '@/lib/models/main'
import { MongoClient, ObjectId } from 'mongodb'
import { sendEmployeeInvitationEmail } from '@/lib/email'
import { 
  generateEmployeeEmail, 
  generateTemporaryPassword, 
  createEmailAccount 
} from '@/lib/email-account-generator'

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

    // Get user details to verify they are HR
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB_NAME)
    
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    })

    if (!user || !user.companyId || !["hr_manager", "company_admin"].includes(user.role)) {
      await client.close()
      return NextResponse.json(
        { error: "Unauthorized. Only HR managers can invite employees." },
        { status: 403 }
      )
    }

    const { name, email, role, department, position } = await request.json()
    
    if (!name || !email) {
      await client.close()
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    await connectToMainDB()

    // Check if invitation already exists for this email and company
    const existingInvitation = await EmployeeInvitation.findOne({
      email: email,
      companyId: user.companyId
    })

    if (existingInvitation) {
      await client.close()
      return NextResponse.json(
        { error: "Invitation already exists for this email" },
        { status: 409 }
      )
    }

    // Get company information first
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(user.companyId) 
    })

    // Generate email credentials for the employee (FREE METHODS)
    const emailStrategy = process.env.EMAIL_STRATEGY as 'gmail' | 'outlook' | 'forwarding' | 'zoho' || 'gmail'
    
    const emailResult = generateEmployeeEmail(
      name, // Use the provided name instead of email prefix
      company?.domain || 'company', 
      user.companyId!,
      emailStrategy
    )
    const temporaryPassword = generateTemporaryPassword()

    // Create the email account (with setup instructions)
    const emailAccountResult = await createEmailAccount(
      emailResult.email,
      temporaryPassword,
      name, // Use the provided name
      company?.name || 'Your New Company',
      emailResult.type
    )

    // Create new invitation with generated credentials
    const invitation = new EmployeeInvitation({
      email: email,
      companyId: user.companyId,
      role: role || "employee",
      department: department,
      position: position,
      invitedBy: user._id,
      generatedEmail: emailResult.email,
      temporaryPassword: temporaryPassword,
      emailCredentialsGenerated: emailAccountResult.success
    })

    await invitation.save()

    await client.close()

    // Send invitation email with credentials
    try {
      const invitationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/onboarding/invitation?invitation=${invitation._id}`
      
      await sendEmployeeInvitationEmail({
        recipientEmail: email,
        recipientName: name,
        companyName: company?.name || 'Your New Company',
        inviterName: user.name || user.email || 'HR Team',
        inviterEmail: user.email,
        role: role || 'employee',
        department: department,
        position: position,
        invitationUrl: invitationUrl,
        employeeCredentials: {
          generatedEmail: emailResult.email,
          temporaryPassword: temporaryPassword,
          setupInstructions: emailAccountResult.instructions,
          provider: emailResult.provider
        }
      })

      console.log(`✅ Invitation email sent to ${email} for ${name} at company ${company?.name}`)
      console.log(`📧 Generated email credentials: ${emailResult.email} / ${temporaryPassword}`)
      console.log(`🔧 Email provider: ${emailResult.provider}`)

      return NextResponse.json({
        success: true,
        invitationId: invitation._id,
        message: "Employee invitation sent successfully with email credentials",
        emailSent: true,
        generatedEmail: emailResult.email,
        emailProvider: emailResult.provider,
        setupInstructions: emailAccountResult.instructions
      })

    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError)
      
      // Still return success since the invitation was created, just note email failed
      return NextResponse.json({
        success: true,
        invitationId: invitation._id,
        message: "Employee invitation created successfully, but email failed to send",
        emailSent: false,
        emailError: String(emailError),
        generatedEmail: emailResult.email
      })
    }

  } catch (error) {
    console.error("Error sending employee invitation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
