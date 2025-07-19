// Free Gmail Account Generation Strategy
// This creates actual Gmail accounts that employees can use

import crypto from "crypto";

export interface GeneratedGmailCredentials {
  email: string;
  password: string;
  recoveryEmail?: string;
  instructions: string[];
}

export function generateGmailAccountDetails(
  employeeName: string,
  companyName: string,
  companyDomain: string
): GeneratedGmailCredentials {
  // Clean employee name
  const cleanName = employeeName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const companyPrefix = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 6);

  // Generate unique Gmail address
  const randomSuffix = crypto.randomBytes(2).toString("hex");
  const email = `${cleanName}.${companyPrefix}.${randomSuffix}@gmail.com`;

  // Generate secure password
  const password = generateSecurePassword();

  return {
    email,
    password,
    recoveryEmail: undefined, // They'll set this up
    instructions: [
      "1. Go to https://accounts.google.com/signup",
      "2. Use the provided email and password",
      "3. Complete Gmail account verification",
      "4. Set up recovery email and phone number",
      "5. Use this email for all company communications",
      "6. Change password after first login for security",
    ],
  };
}

function generateSecurePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = "";

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
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Alternative: Use existing email + alias system
export function generateEmailAlias(
  employeeName: string,
  companyEmail: string // e.g., "yourcompany@gmail.com"
): string {
  const cleanName = employeeName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const [emailPart, domain] = companyEmail.split("@");

  // Gmail supports + aliases: yourcompany+john@gmail.com
  return `${emailPart}+${cleanName}@${domain}`;
}
