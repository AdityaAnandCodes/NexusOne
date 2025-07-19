// Free Business Email Providers
export const freeEmailProviders = [
  {
    name: "Zoho Mail",
    url: "https://www.zoho.com/mail/",
    features: [
      "Free for up to 5 users",
      "5GB storage per user",
      "Custom domain support",
      "Web and mobile apps",
      "25MB attachment limit",
    ],
    setup: [
      "1. Sign up at zoho.com/mail",
      "2. Add your domain",
      "3. Verify domain ownership",
      "4. Create user accounts",
      "5. Update MX records",
    ],
  },
  {
    name: "Yandex Mail for Domain",
    url: "https://360.yandex.com/mail/",
    features: [
      "Free for unlimited users",
      "10GB storage per user",
      "Custom domain support",
      "No ads",
      "IMAP/POP3 support",
    ],
  },
  {
    name: "ImprovMX (Email Forwarding)",
    url: "https://improvmx.com/",
    features: [
      "Free email forwarding",
      "Unlimited aliases",
      "Custom domain",
      "Easy setup",
      "Forward to any email",
    ],
  },
  {
    name: "ForwardEmail.net",
    url: "https://forwardemail.net/",
    features: [
      "Free email forwarding",
      "Open source",
      "Privacy focused",
      "Unlimited aliases",
      "Custom domain",
    ],
  },
];

export function generateEmailWithFreeProvider(
  employeeName: string,
  companyDomain: string,
  provider: "zoho" | "yandex" | "improvmx" = "zoho"
) {
  const cleanName = employeeName.toLowerCase().replace(/[^a-z0-9]/g, "");

  switch (provider) {
    case "zoho":
      return {
        email: `${cleanName}@${companyDomain}`,
        provider: "Zoho Mail",
        setupUrl: "https://www.zoho.com/mail/",
        instructions: [
          "1. Admin sets up domain in Zoho Mail",
          "2. Creates user account",
          "3. Employee accesses via mail.zoho.com",
          "4. Can use email clients via IMAP",
        ],
      };

    case "improvmx":
      return {
        email: `${cleanName}@${companyDomain}`,
        provider: "ImprovMX Forwarding",
        setupUrl: "https://improvmx.com/",
        instructions: [
          "1. Admin adds domain to ImprovMX",
          "2. Sets up forwarding rule",
          "3. Employee receives emails at personal address",
          "4. Can reply using company email",
        ],
      };

    default:
      return generateEmailWithFreeProvider(employeeName, companyDomain, "zoho");
  }
}
