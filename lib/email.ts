import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = async () => {
  // For development, we'll use Ethereal Email (fake SMTP) if no real credentials provided
  const useEthereal = process.env.USE_ETHEREAL_EMAIL === 'true' || 
                     !process.env.SMTP_USER || 
                     !process.env.SMTP_PASS

  if (useEthereal) {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount()
    console.log('Using Ethereal Email for testing')
    console.log('Test email credentials:', {
      user: testAccount.user,
      pass: testAccount.pass
    })
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  } else {
    // Use real SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
}

export interface SendEmployeeInvitationEmailParams {
  recipientEmail: string
  recipientName?: string
  companyName: string
  inviterName: string
  inviterEmail: string
  role: string
  department?: string
  position?: string
  invitationUrl: string
  employeeCredentials?: {
    generatedEmail: string
    temporaryPassword: string
    setupInstructions?: string[]
    provider?: string
  }
}

export async function sendEmployeeInvitationEmail(params: SendEmployeeInvitationEmailParams) {
  const {
    recipientEmail,
    recipientName,
    companyName,
    inviterName,
    inviterEmail,
    role,
    department,
    position,
    invitationUrl,
    employeeCredentials
  } = params

  const transporter = await createTransporter()

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${companyName}</title>
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: linear-gradient(135deg, #1e293b, #1e40af, #3730a3); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .btn:hover { background: #2563eb; }
        .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details h3 { margin-top: 0; color: #374151; }
        .details p { margin: 8px 0; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ${companyName}!</h1>
          <p>You've been invited to join our team</p>
        </div>
        
        <div class="content">
          <h2>Hi ${recipientName || 'there'}!</h2>
          
          <p><strong>${inviterName}</strong> from <strong>${companyName}</strong> has invited you to join their team on NexusOne.</p>
          
          <div class="details">
            <h3>Invitation Details</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Role:</strong> ${role}</p>
            ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
            ${position ? `<p><strong>Position:</strong> ${position}</p>` : ''}
            <p><strong>Invited by:</strong> ${inviterName} (${inviterEmail})</p>
          </div>
          
          ${employeeCredentials ? `
          <div class="details" style="border-left: 4px solid #10b981;">
            <h3>🔐 Your Company Email Credentials</h3>
            <p style="color: #059669; font-weight: bold;">
              ${employeeCredentials.provider || 'An email account'} has been set up for you!
            </p>
            <p><strong>Email:</strong> ${employeeCredentials.generatedEmail}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${employeeCredentials.temporaryPassword}</code></p>
            
            ${employeeCredentials.setupInstructions ? `
            <div style="margin-top: 15px; padding: 10px; background: #f0f9ff; border-radius: 6px;">
              <p style="font-weight: bold; margin-bottom: 8px;">📋 Setup Instructions:</p>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                ${employeeCredentials.setupInstructions.map(instruction => 
                  `<li style="margin-bottom: 4px;">${instruction}</li>`
                ).join('')}
              </ol>
            </div>
            ` : ''}
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              📝 <strong>Important:</strong> Please change your password after first login for security.
            </p>
          </div>
          ` : ''}
          
          <p>To get started, click the button below to sign up and join your new team:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" class="btn">Accept Invitation & Join Team</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation was sent to ${recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2025 NexusOne. Streamlining employee onboarding.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
Welcome to ${companyName}!

Hi ${recipientName || 'there'}!

${inviterName} from ${companyName} has invited you to join their team on NexusOne.

Invitation Details:
- Company: ${companyName}
- Role: ${role}
${department ? `- Department: ${department}` : ''}
${position ? `- Position: ${position}` : ''}
- Invited by: ${inviterName} (${inviterEmail})

${employeeCredentials ? `
Company Email Credentials:
- Email: ${employeeCredentials.generatedEmail}
- Temporary Password: ${employeeCredentials.temporaryPassword}

IMPORTANT: Please change your password after first login for security.
` : ''}

To get started, visit this link to sign up and join your new team:
${invitationUrl}

This invitation was sent to ${recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.

© 2025 NexusOne. Streamlining employee onboarding.
  `

  const mailOptions = {
    from: {
      name: `${companyName} via NexusOne`,
      address: process.env.SMTP_USER || process.env.GOOGLE_EMAIL || 'noreply@nexusone.com'
    },
    to: recipientEmail,
    subject: `Welcome to ${companyName} - Join Your New Team`,
    text: textContent,
    html: htmlContent,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    
    // For Ethereal email, log the preview URL
    const useEthereal = process.env.USE_ETHEREAL_EMAIL === 'true' || 
                       !process.env.SMTP_USER || 
                       !process.env.SMTP_PASS
    
    if (useEthereal) {
      console.log('📧 Test email sent! Preview URL:', nodemailer.getTestMessageUrl(info))
    } else {
      console.log('📧 Real email sent via Gmail SMTP!')
    }
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      recipient: recipientEmail,
      company: companyName,
      previewUrl: useEthereal ? nodemailer.getTestMessageUrl(info) : null
    })
    
    return { 
      success: true, 
      messageId: info.messageId,
      previewUrl: useEthereal ? nodemailer.getTestMessageUrl(info) : null
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error(`Failed to send invitation email: ${error}`)
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    const transporter = await createTransporter()
    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}
