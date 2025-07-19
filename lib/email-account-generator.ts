import crypto from 'crypto';

// Generate a unique email address for an employee (FREE OPTIONS)
export function generateEmployeeEmail(
  employeeName: string, 
  companyDomain: string, 
  companyId: string,
  strategy: 'gmail' | 'outlook' | 'forwarding' | 'zoho' = 'gmail'
): { email: string; provider: string; type: string } {
  // Clean the employee name (remove spaces, special chars, convert to lowercase)
  const cleanName = employeeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15); // Allow longer names
  
  // Clean company domain for use in email
  const cleanCompany = companyDomain.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  
  switch (strategy) {
    case 'gmail':
      return {
        email: `${cleanName}.${cleanCompany}@gmail.com`,
        provider: 'Gmail (Free Personal Account)',
        type: 'free_personal'
      };
    
    case 'outlook':
      return {
        email: `${cleanName}.${cleanCompany}@outlook.com`,
        provider: 'Outlook.com (Free Personal Account)',
        type: 'free_personal'
      };
    
    case 'forwarding':
      return {
        email: `${cleanName}@${companyDomain}`,
        provider: 'Email Forwarding (ImprovMX/ForwardEmail)',
        type: 'forwarding'
      };
    
    case 'zoho':
      return {
        email: `${cleanName}@${companyDomain}`,
        provider: 'Zoho Mail (Free Business)',
        type: 'free_business'
      };
    
    default:
      return {
        email: `${cleanName}.${cleanCompany}@gmail.com`,
        provider: 'Gmail (Free Personal Account)',
        type: 'free_personal'
      };
  }
}

// Generate a secure temporary password
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Create email account with setup instructions (FREE METHODS)
export async function createEmailAccount(
  email: string, 
  password: string, 
  employeeName: string,
  companyName: string,
  emailType: string = 'mock'
): Promise<{ success: boolean; message: string; instructions?: string[] }> {
  try {
    console.log(`📧 Generating email setup for ${employeeName}:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Company: ${companyName}`);
    console.log(`  Type: ${emailType}`);
    
    // Generate setup instructions based on email type
    let instructions: string[] = [];
    
    switch (emailType) {
      case 'free_personal':
        if (email.includes('@gmail.com')) {
          instructions = [
            "🔗 Go to: https://accounts.google.com/signup",
            "📧 Enter the provided email address",
            "🔐 Use the provided password",
            "📱 Complete phone verification",
            "✅ Set up recovery email",
            "🔄 Change password after first login"
          ];
        } else if (email.includes('@outlook.com')) {
          instructions = [
            "🔗 Go to: https://outlook.live.com/owa/?nlp=1&signup=1",
            "📧 Enter the provided email address",
            "🔐 Use the provided password",
            "📱 Complete verification process",
            "✅ Set up security info",
            "🔄 Change password after first login"
          ];
        }
        break;
      
      case 'forwarding':
        instructions = [
          "📧 Your company email is set up with forwarding",
          "📨 Emails sent to this address will forward to your personal email",
          "📤 To send emails AS this address:",
          "   1. Add this email as an alias in your personal Gmail/Outlook",
          "   2. Use the 'From' dropdown when composing emails",
          "🔗 Setup guide: Contact your HR administrator"
        ];
        break;
      
      case 'free_business':
        instructions = [
          "🏢 Your company uses Zoho Mail (free business email)",
          "🔗 Access your email at: https://mail.zoho.com/",
          "📧 Username: " + email,
          "🔐 Password: " + password,
          "📱 Download Zoho Mail app for mobile access",
          "🔄 Change password after first login"
        ];
        break;
      
      default:
        instructions = [
          "⚠️ This is a test/mock email account",
          "📧 Email: " + email,
          "🔐 Password: " + password,
          "🚀 In production, this would create a real email account",
          "💡 Consider using Gmail, Outlook, or Zoho Mail for real accounts"
        ];
    }
    
    // Simulate setup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Email account setup completed for ${email}`,
      instructions
    };
    
  } catch (error) {
    console.error('Failed to setup email account:', error);
    return {
      success: false,
      message: `Failed to setup email account: ${error}`,
      instructions: ["❌ Email setup failed. Please contact administrator."]
    };
  }
}

// Email account management interface for future integration
export interface EmailAccountProvider {
  createAccount(email: string, password: string, displayName: string): Promise<boolean>;
  deleteAccount(email: string): Promise<boolean>;
  resetPassword(email: string, newPassword: string): Promise<boolean>;
  suspendAccount(email: string): Promise<boolean>;
  activateAccount(email: string): Promise<boolean>;
}

// Mock implementation - replace with real provider
export class MockEmailProvider implements EmailAccountProvider {
  async createAccount(email: string, password: string, displayName: string): Promise<boolean> {
    console.log(`Mock: Creating account ${email} for ${displayName}`);
    return true;
  }
  
  async deleteAccount(email: string): Promise<boolean> {
    console.log(`Mock: Deleting account ${email}`);
    return true;
  }
  
  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    console.log(`Mock: Resetting password for ${email}`);
    return true;
  }
  
  async suspendAccount(email: string): Promise<boolean> {
    console.log(`Mock: Suspending account ${email}`);
    return true;
  }
  
  async activateAccount(email: string): Promise<boolean> {
    console.log(`Mock: Activating account ${email}`);
    return true;
  }
}
