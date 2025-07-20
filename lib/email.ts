import nodemailer from "nodemailer";

// Email configuration
const createTransporter = async () => {
  // For development, we'll use Ethereal Email (fake SMTP) if no real credentials provided
  const useEthereal =
    process.env.USE_ETHEREAL_EMAIL === "true" ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS;

  if (useEthereal) {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();
    console.log("Using Ethereal Email for testing");
    console.log("Test email credentials:", {
      user: testAccount.user,
      pass: testAccount.pass,
    });

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Use real SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

export interface SendEmployeeInvitationEmailParams {
  recipientEmail: string;
  recipientName?: string;
  companyName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  department?: string;
  position?: string;
  invitationUrl: string;
  employeeCredentials?: {
    generatedEmail: string;
    temporaryPassword: string;
    setupInstructions?: string[];
    provider?: string;
  };
}

export async function sendEmployeeInvitationEmail(
  params: SendEmployeeInvitationEmailParams
) {
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
    employeeCredentials,
  } = params;

  const transporter = await createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${companyName}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #0E0E0E;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
        }
        .header { 
          background-color: #ffffff;
          padding: 48px 32px 32px 32px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 50px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.025em;
          color: #0E0E0E;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #0E0E0E;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .header h1 {
          font-size: 42px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 16px 0;
          color: #0E0E0E;
        }
        .header .subtitle {
          font-size: 20px;
          font-weight: 400;
          color: #0E0E0E;
          opacity: 0.8;
          margin: 0;
        }
        .content { 
          background-color: #ffffff;
          padding: 32px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #0E0E0E;
        }
        .intro-text {
          font-size: 16px;
          margin-bottom: 32px;
          color: #0E0E0E;
          opacity: 0.8;
        }
        .details-card { 
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .details-card h3 { 
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #0E0E0E;
        }
        .details-card p { 
          font-size: 14px;
          margin: 8px 0;
          color: #0E0E0E;
          opacity: 0.8;
        }
        .credentials-card {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .credentials-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #0E0E0E;
        }
        .credentials-highlight {
          color: #0E0E0E;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .password-code {
          background-color: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
          font-weight: 600;
          color: #0E0E0E;
        }
        .setup-instructions {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        .setup-instructions h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #0E0E0E;
        }
        .setup-instructions ol {
          margin: 0;
          padding-left: 20px;
          color: #0E0E0E;
          opacity: 0.8;
        }
        .setup-instructions li {
          margin-bottom: 4px;
          font-size: 14px;
        }
        .security-note {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-top: 16px;
          font-size: 14px;
          color: #0E0E0E;
          opacity: 0.8;
        }
        .cta-section {
          text-align: center;
          margin: 40px 0;
        }
        .cta-text {
          font-size: 16px;
          margin-bottom: 24px;
          color: #0E0E0E;
          opacity: 0.8;
        }
        .btn { 
          display: inline-block;
          background-color: #0E0E0E;
          color: #ffffff;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          font-family: 'Inter', system-ui, sans-serif;
          transition: all 0.3s ease;
        }
        .btn:hover { 
          background-color: #374151;
          transform: translateY(-1px);
        }
        .link-fallback {
          margin-top: 24px;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .link-fallback p {
          font-size: 14px;
          color: #0E0E0E;
          opacity: 0.8;
          margin: 0 0 8px 0;
        }
        .link-fallback a {
          color: #0E0E0E;
          word-break: break-all;
        }
        .divider {
          margin: 32px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
        .disclaimer {
          font-size: 14px;
          color: #0E0E0E;
          opacity: 0.6;
          margin: 0;
        }
        .footer { 
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          font-size: 12px;
          color: #0E0E0E;
          opacity: 0.6;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="status-badge">
            <div class="pulse-dot"></div>
            NEXUS - TEAM INVITATION
          </div>
          <h1>Welcome to <span style="color: #374151;">${companyName}</span></h1>
          <p class="subtitle">You've been invited to join our team</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${recipientName || "there"}!</div>
          
          <p class="intro-text"><strong>${inviterName}</strong> from <strong>${companyName}</strong> has invited you to join their team on NexusOne.</p>
          
          <div class="details-card">
            <h3>Invitation Details</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Role:</strong> ${role}</p>
            ${
              department
                ? `<p><strong>Department:</strong> ${department}</p>`
                : ""
            }
            ${position ? `<p><strong>Position:</strong> ${position}</p>` : ""}
            <p><strong>Invited by:</strong> ${inviterName} (${inviterEmail})</p>
          </div>
          
          ${
            employeeCredentials
              ? `
          <div class="credentials-card">
            <h3>🔐 Your Company Email Credentials</h3>
            <p class="credentials-highlight">
              ${
                employeeCredentials.provider || "An email account"
              } has been set up for you!
            </p>
            <p><strong>Email:</strong> ${employeeCredentials.generatedEmail}</p>
            <p><strong>Temporary Password:</strong> <span class="password-code">${
              employeeCredentials.temporaryPassword
            }</span></p>
            
            ${
              employeeCredentials.setupInstructions
                ? `
            <div class="setup-instructions">
              <h4>📋 Setup Instructions:</h4>
              <ol>
                ${employeeCredentials.setupInstructions
                  .map((instruction) => `<li>${instruction}</li>`)
                  .join("")}
              </ol>
            </div>
            `
                : ""
            }
            
            <div class="security-note">
              <strong>📝 Important:</strong> Please change your password after first login for security.
            </div>
          </div>
          `
              : ""
          }
          
          <div class="cta-section">
            <p class="cta-text">To get started, click the button below to sign up and join your new team:</p>
            <a href="${invitationUrl}" class="btn">Accept Invitation & Join Team</a>
            
            <div class="link-fallback">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <a href="${invitationUrl}">${invitationUrl}</a>
            </div>
          </div>
          
          <hr class="divider">
          
          <p class="disclaimer">
            This invitation was sent to ${recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 NexusOne. Streamlining employee onboarding.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to ${companyName}!

Hi ${recipientName || "there"}!

${inviterName} from ${companyName} has invited you to join their team on NexusOne.

Invitation Details:
- Company: ${companyName}
- Role: ${role}
${department ? `- Department: ${department}` : ""}
${position ? `- Position: ${position}` : ""}
- Invited by: ${inviterName} (${inviterEmail})

${
  employeeCredentials
    ? `
Company Email Credentials:
- Email: ${employeeCredentials.generatedEmail}
- Temporary Password: ${employeeCredentials.temporaryPassword}

IMPORTANT: Please change your password after first login for security.
`
    : ""
}

To get started, visit this link to sign up and join your new team:
${invitationUrl}

This invitation was sent to ${recipientEmail}. If you didn't expect this invitation, you can safely ignore this email.

© 2025 NexusOne. Streamlining employee onboarding.
  `;

  const mailOptions = {
    from: {
      name: `${companyName} via NexusOne`,
      address:
        process.env.SMTP_USER ||
        process.env.GOOGLE_EMAIL ||
        "noreply@nexusone.com",
    },
    to: recipientEmail,
    subject: `Welcome to ${companyName} - Join Your New Team`,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    // For Ethereal email, log the preview URL
    const useEthereal =
      process.env.USE_ETHEREAL_EMAIL === "true" ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS;

    if (useEthereal) {
      console.log(
        "📧 Test email sent! Preview URL:",
        nodemailer.getTestMessageUrl(info)
      );
    } else {
      console.log("📧 Real email sent via Gmail SMTP!");
    }

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      recipient: recipientEmail,
      company: companyName,
      previewUrl: useEthereal ? nodemailer.getTestMessageUrl(info) : null,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: useEthereal ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send invitation email: ${error}`);
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
