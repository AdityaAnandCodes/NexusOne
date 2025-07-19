// Google Workspace Admin SDK Integration
// This file shows how to integrate with Google Workspace to create real email accounts

import { google } from "googleapis";

interface GoogleWorkspaceConfig {
  clientEmail: string;
  privateKey: string;
  adminEmail: string; // Super admin email for the workspace
  domain: string; // Your company domain (e.g., yourcompany.com)
}

export class GoogleWorkspaceEmailProvider {
  private admin: any;
  private config: GoogleWorkspaceConfig;

  constructor(config: GoogleWorkspaceConfig) {
    this.config = config;

    // Initialize Google Auth with service account
    const auth = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/admin.directory.user"],
      config.adminEmail
    );

    this.admin = google.admin({ version: "directory_v1", auth });
  }

  async createEmployeeEmailAccount(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    department?: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.admin.users.insert({
        requestBody: {
          primaryEmail: email,
          name: {
            givenName: firstName,
            familyName: lastName,
          },
          password: password,
          changePasswordAtNextLogin: true, // Force password change on first login
          orgUnitPath: department ? `/Departments/${department}` : "/",
          includeInGlobalAddressList: true,
        },
      });

      console.log(`✅ Google Workspace account created: ${email}`);
      return { success: true, user: user.data };
    } catch (error: any) {
      console.error("Failed to create Google Workspace account:", error);
      return {
        success: false,
        error: error.message || "Failed to create email account",
      };
    }
  }

  async deleteEmailAccount(email: string): Promise<boolean> {
    try {
      await this.admin.users.delete({ userKey: email });
      console.log(`🗑️ Google Workspace account deleted: ${email}`);
      return true;
    } catch (error) {
      console.error("Failed to delete Google Workspace account:", error);
      return false;
    }
  }

  async suspendEmailAccount(email: string): Promise<boolean> {
    try {
      await this.admin.users.update({
        userKey: email,
        requestBody: { suspended: true },
      });
      console.log(`⏸️ Google Workspace account suspended: ${email}`);
      return true;
    } catch (error) {
      console.error("Failed to suspend Google Workspace account:", error);
      return false;
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      await this.admin.users.update({
        userKey: email,
        requestBody: {
          password: newPassword,
          changePasswordAtNextLogin: true,
        },
      });
      console.log(`🔐 Password reset for: ${email}`);
      return true;
    } catch (error) {
      console.error("Failed to reset password:", error);
      return false;
    }
  }
}

// Usage example:
export async function createRealGoogleWorkspaceAccount(
  employeeName: string,
  companyDomain: string,
  department?: string
) {
  // These would come from environment variables
  const config: GoogleWorkspaceConfig = {
    clientEmail: process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_WORKSPACE_PRIVATE_KEY!,
    adminEmail: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL!,
    domain: companyDomain,
  };

  const provider = new GoogleWorkspaceEmailProvider(config);

  const [firstName, ...lastNameParts] = employeeName.split(" ");
  const lastName = lastNameParts.join(" ") || firstName;

  // Generate email like: john.doe@company.com
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
  const password = generateTemporaryPassword(12);

  return await provider.createEmployeeEmailAccount(
    email,
    password,
    firstName,
    lastName,
    department
  );
}

/* 
To set this up for REAL email accounts:

1. Set up Google Workspace for your company domain
2. Create a service account in Google Cloud Console
3. Enable Admin SDK API
4. Grant domain-wide delegation to the service account
5. Add these environment variables:

GOOGLE_WORKSPACE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourcompany.com
COMPANY_DOMAIN=yourcompany.com

6. Install the Google APIs package:
npm install googleapis

7. Replace the mock createEmailAccount function with this real implementation
*/
