// Free Outlook.com Account Strategy
export function generateOutlookAccountDetails(
  employeeName: string,
  companyName: string
) {
  const cleanName = employeeName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const companyPrefix = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 6);
  const randomSuffix = crypto.randomBytes(2).toString("hex");

  return {
    email: `${cleanName}.${companyPrefix}.${randomSuffix}@outlook.com`,
    password: generateSecurePassword(),
    instructions: [
      "1. Go to https://outlook.live.com/owa/?nlp=1&signup=1",
      "2. Use the provided email and password",
      "3. Complete Microsoft account verification",
      "4. Set up security info (phone/alternate email)",
      "5. Use this for all company communications",
    ],
  };
}
