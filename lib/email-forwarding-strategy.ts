// Email Forwarding Strategy
// Use one company Gmail and create forwarding rules

export interface EmailForwardingSetup {
  companyEmail: string; // Main company email
  employeeAlias: string; // Alias for employee
  forwardToEmail: string; // Employee's personal email
  gmailFilterInstructions: string[];
}

export function setupEmailForwarding(
  employeeName: string,
  employeePersonalEmail: string,
  companyEmail: string = "yourcompany@gmail.com"
): EmailForwardingSetup {
  const cleanName = employeeName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const [emailPart, domain] = companyEmail.split('@');
  
  // Create alias using Gmail + system
  const employeeAlias = `${emailPart}+${cleanName}@${domain}`;
  
  return {
    companyEmail,
    employeeAlias,
    forwardToEmail: employeePersonalEmail,
    gmailFilterInstructions: [
      "1. Log into the main company Gmail account",
      "2. Go to Settings > Filters and Blocked Addresses",
      "3. Create a new filter with criteria:",
      `   - To: ${employeeAlias}`,
      "4. Choose action: Forward to " + employeePersonalEmail,
      "5. Employee can send emails as the alias from their personal account"
    ]
  };
}

// Instructions for employees to send AS the company email
export function getEmployeeSendingInstructions(alias: string): string[] {
  return [
    "To send emails as your company address:",
    "1. In your personal Gmail, go to Settings > Accounts and Import",
    "2. Click 'Add another email address'",
    `3. Add: ${alias}`,
    "4. When composing emails, select this address in the 'From' field"
  ];
}
