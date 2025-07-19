// api/notion/workspace/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import * as nodemailer from "nodemailer";

interface AuthData {
  access_token: string;
  workspace_name: string;
}

interface InviteRequest {
  email: string;
  pageId?: string;
  permission?: "fullaccess" | "edit" | "comment" | "view";
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("notion_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      email,
      pageId,
      permission = "comment",
    }: InviteRequest = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // Read token from file for verification
    const tokenFile = path.join(process.cwd(), "tokens", `${userId}.json`);
    const data = await fs.readFile(tokenFile, "utf-8");
    const authData: AuthData = JSON.parse(data);

    // For workspace invitations, provide manual instructions
    if (!pageId) {
      // Store invitation record
      await storeInvitationRecord({
        userId,
        email,
        type: "workspace",
        status: "pending",
        timestamp: new Date().toISOString(),
      });

      // Send email with instructions (if email is configured)
      if (process.env.SMTP_HOST) {
        try {
          await sendWorkspaceInviteEmail(email, authData.workspace_name);
        } catch (emailError) {
          console.log(
            "Email sending failed, but invitation instructions are still provided:",
            emailError
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Workspace invitation instructions generated",
        invited_email: email,
        instructions: {
          manual_steps: [
            "1. Open Notion workspace settings",
            "2. Go to 'Settings & Members'",
            "3. Click 'Invite a person'",
            `4. Enter '${email}' and send invitation`,
          ],
          workspace_name: authData.workspace_name,
        },
      });
    }

    // **NEW: Use external Notion invite service for page invitations**
    if (pageId) {
      try {
        console.log(
          `Attempting to invite ${email} to page ${pageId} with ${permission} permission via external service`
        );

        const inviteResponse = await callExternalInviteService(
          email,
          pageId,
          permission
        );

        // Store invitation record with external service status
        await storeInvitationRecord({
          userId,
          email,
          pageId,
          permission,
          type: "page",
          status: "sent_via_external_service",
          timestamp: new Date().toISOString(),
          external_service_response: inviteResponse,
        });

        return NextResponse.json({
          success: true,
          message: "Page invitation sent via automated service",
          invited_email: email,
          page_id: pageId,
          permission: permission,
          service_response: inviteResponse,
          method: "external_automation",
        });
      } catch (externalError) {
        console.error(
          "External invite service failed, falling back to manual process:",
          externalError
        );

        // **FALLBACK: Original manual process for page invitations**
        const pageUrl = `https://www.notion.so/${pageId.replace(/-/g, "")}`;

        // Store invitation record with fallback status
        await storeInvitationRecord({
          userId,
          email,
          pageId,
          permission,
          type: "page",
          status: "fallback_to_manual",
          timestamp: new Date().toISOString(),
          external_service_error:
            externalError instanceof Error
              ? externalError.message
              : String(externalError),
        });

        // Send email with page details (if email is configured)
        if (process.env.SMTP_HOST) {
          try {
            await sendPageInviteEmail(
              email,
              pageUrl,
              permission,
              authData.workspace_name
            );
          } catch (emailError) {
            console.log(
              "Email sending failed, but page invitation instructions are still provided:",
              emailError
            );
          }
        }

        return NextResponse.json({
          success: true,
          message:
            "External service failed, page invitation processed with manual instructions",
          invited_email: email,
          page_id: pageId,
          page_url: pageUrl,
          permission: permission,
          method: "manual_fallback",
          external_service_error:
            externalError instanceof Error
              ? externalError.message
              : String(externalError),
          instructions: {
            manual_steps: [
              "1. Open the Notion page",
              "2. Click 'Share' in the top-right corner",
              `3. Enter '${email}' and set permissions to '${permission}'`,
              "4. Click 'Invite'",
            ],
            auto_steps: [
              `1. Send this link to ${email}: ${pageUrl}`,
              "2. They can click 'Request Access' if needed",
              "3. You'll get a notification to approve access",
            ],
          },
        });
      }
    }

    // This shouldn't be reached, but keeping as safety fallback
    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}

// **NEW: Function to call external Notion invite service**
async function callExternalInviteService(
  email: string,
  pageId: string,
  permission: string
): Promise<any> {
  const baseUrl =
    process.env.NOTION_INVITE_API_URL ||
    "https://notioninvites.d3vlab.workers.dev";

  // Clean pageId - remove dashes if present for the API call
  const cleanPageId = pageId.replace(/-/g, "");

  const inviteUrl = `${baseUrl}/invite?email=${encodeURIComponent(
    email
  )}&pageid=${cleanPageId}&permission=${permission}`;

  console.log(`Calling external invite service: ${inviteUrl}`);

  const response = await fetch(inviteUrl, {
    method: "GET", // Most external APIs use GET for this type of operation
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NextJS-Notion-Invite-Integration",
    },
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `External invite service failed with status ${response.status}: ${errorText}`
    );
  }

  const result = await response.json();
  console.log("External service response:", result);

  return result;
}

// Helper function to send workspace invitation email
async function sendWorkspaceInviteEmail(email: string, workspaceName: string) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    console.log("Email configuration not found, skipping email send");
    return;
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invitation to ${workspaceName} Notion Workspace</h2>
        
        <p>Hello,</p>
        
        <p>You've been invited to join the <strong>${workspaceName}</strong> Notion workspace.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>How to join the workspace:</h3>
          <ol>
            <li>The workspace owner needs to invite you manually through Notion</li>
            <li>They can do this by going to Settings & Members in their Notion workspace</li>
            <li>Clicking "Invite a person" and entering your email: <strong>${email}</strong></li>
            <li>You'll then receive an official invitation from Notion</li>
          </ol>
        </div>
        
        <p>If you don't receive an invitation within 24 hours, please contact the person who sent you this message.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This invitation was sent via an automated system.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER,
      to: email,
      subject: `Invitation to ${workspaceName} Notion Workspace`,
      html: emailContent,
    });

    console.log(`Workspace invite email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send workspace invite email:", error);
    throw error;
  }
}

// Helper function to send page invitation email
async function sendPageInviteEmail(
  email: string,
  pageUrl: string,
  permission: string,
  workspaceName: string
) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    console.log("Email configuration not found, skipping email send");
    return;
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const permissionText =
      {
        view: "View Only",
        comment: "Can Comment",
        edit: "Can Edit",
        fullaccess: "Full Access",
      }[permission] || "View Only";

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to view a Notion page</h2>
        
        <p>Hello,</p>
        
        <p>You've been invited to access a Notion page in the <strong>${workspaceName}</strong> workspace with <strong>${permissionText}</strong> permissions.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>How to access the page:</h3>
          <ol>
            <li>Click this link: <a href="${pageUrl}" target="_blank" style="color: #0066cc;">Open Notion Page</a></li>
            <li>If you don't have access, click "Request Access" on the Notion page</li>
            <li>The page owner will need to approve your access request</li>
          </ol>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>📝 For the page owner:</h4>
          <p>To grant access manually:</p>
          <ol>
            <li>Open the Notion page</li>
            <li>Click "Share" in the top-right corner</li>
            <li>Enter "${email}" and set permissions to "${permissionText}"</li>
            <li>Click "Invite"</li>
          </ol>
        </div>
        
        <p style="margin-top: 30px;">
          <strong>Direct link:</strong><br>
          <a href="${pageUrl}" target="_blank" style="color: #0066cc;">${pageUrl}</a>
        </p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This invitation was sent via an automated system.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER,
      to: email,
      subject: `Invitation to view Notion page in ${workspaceName}`,
      html: emailContent,
    });

    console.log(`Page invite email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send page invite email:", error);
    throw error;
  }
}

// Helper function to store invitation records
async function storeInvitationRecord(record: any) {
  const invitationsFile = path.join(process.cwd(), "data", "invitations.json");

  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(invitationsFile), { recursive: true });

    let invitations = [];

    try {
      const existingData = await fs.readFile(invitationsFile, "utf-8");
      invitations = JSON.parse(existingData);
    } catch (readError) {
      // File doesn't exist or is invalid, start with empty array
      console.log("Creating new invitations file");
    }

    invitations.push(record);
    await fs.writeFile(invitationsFile, JSON.stringify(invitations, null, 2));
    console.log("Invitation record stored successfully");
  } catch (error) {
    console.error("Failed to store invitation record:", error);
    // Don't throw error here as this shouldn't break the main flow
  }
}
