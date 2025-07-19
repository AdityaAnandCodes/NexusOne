class ResumeProcessor {
  /**
   * Process resume text using Gemini AI to extract employee information
   * @param {string} resumeText - The extracted text from resume
   * @param {GoogleGenerativeAI} genAI - Gemini AI instance
   * @returns {Promise<Object>} - Processed employee data
   */
  async processResume(resumeText, genAI) {
    try {
      console.log("🤖 Starting Gemini AI processing...");

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0.1, // Low temperature for more consistent extraction
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
      });

      const prompt = this.createExtractionPrompt(resumeText);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("🤖 Gemini raw response:", text);

      // Parse the structured response
      const extractedData = this.parseGeminiResponse(text);

      // Validate and clean the extracted data
      const validatedData = this.validateExtractedData(extractedData);

      console.log("✅ Final processed data:", validatedData);

      return validatedData;
    } catch (error) {
      console.error("Gemini processing error:", error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Create a structured prompt for Gemini AI
   * @param {string} resumeText - The resume text to process
   * @returns {string} - The structured prompt
   */
  createExtractionPrompt(resumeText) {
    return `
You are an expert HR assistant. Analyze the following resume text and extract the person's information in JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract the candidate's personal information (name, email, phone, and skills)
2. Return a valid JSON object with exactly these fields: name, email, phone, skills
3. If multiple emails are found, choose the most professional/personal one (avoid company emails)
4. For name, extract the full name as it appears prominently in the resume
5. For phone, extract the primary contact number (format: clean number with country code if available)
6. For skills, extract an array of technical and professional skills mentioned in the resume
7. If information is not found, use null for that field (empty array [] for skills if none found)
8. Do not include any additional text or explanations, only the JSON object

RESUME TEXT:
${resumeText}

Expected JSON format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "skills": ["JavaScript", "React", "Node.js", "Project Management"]
}

JSON Response:`;
  }

  /**
   * Parse Gemini's response and extract structured data
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} - Parsed data object
   */
  parseGeminiResponse(responseText) {
    try {
      // Clean the response text
      let cleanText = responseText.trim();

      // Remove any markdown code blocks
      cleanText = cleanText.replace(/```json\s*|\s*```/g, "");
      cleanText = cleanText.replace(/```\s*|\s*```/g, "");

      // Try to find JSON object in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log("📝 Parsing JSON:", jsonString);

        const parsed = JSON.parse(jsonString);
        return parsed;
      } else {
        // Fallback: try to extract information manually
        console.warn("⚠️ No JSON found, attempting manual extraction");
        return this.manualExtraction(responseText);
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
      console.log("Raw response:", responseText);

      // Fallback to manual extraction
      return this.manualExtraction(responseText);
    }
  }

  /**
   * Manual extraction as fallback when JSON parsing fails
   * @param {string} text - Text to extract from
   * @returns {Object} - Extracted data
   */
  manualExtraction(text) {
    console.log("🔧 Performing manual extraction...");

    const extracted = {
      name: null,
      email: null,
      phone: null,
      skills: [],
    };

    // Extract email using regex
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);

    if (emails && emails.length > 0) {
      // Choose the most appropriate email (prefer personal over company emails)
      const personalEmail = emails.find(
        (email) =>
          !email.includes("company") &&
          !email.includes("corp") &&
          !email.includes("inc") &&
          !email.includes("ltd")
      );
      extracted.email = personalEmail || emails[0];
    }

    // Extract phone number using regex
    const phonePatterns = [
      /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
      /(?:\+?[1-9]\d{0,3}[-.\s]?)?\(?([0-9]{1,4})\)?[-.\s]?([0-9]{1,4})[-.\s]?([0-9]{1,4})[-.\s]?([0-9]{1,4})/g, // International
      /(?:phone|tel|mobile|cell):\s*([+\d\s\-\(\)\.]+)/gi, // Labeled phone numbers
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Clean the phone number
        const cleanPhone = matches[0].replace(/[^\d+]/g, "");
        if (cleanPhone.length >= 10) {
          extracted.phone = cleanPhone;
          break;
        }
      }
    }

    // Extract skills using common skill keywords and patterns
    const skillCategories = {
      programming: [
        "javascript",
        "python",
        "java",
        "c++",
        "c#",
        "php",
        "ruby",
        "go",
        "rust",
        "swift",
        "kotlin",
      ],
      frameworks: [
        "react",
        "angular",
        "vue",
        "node.js",
        "express",
        "django",
        "flask",
        "spring",
        "laravel",
      ],
      databases: [
        "mysql",
        "postgresql",
        "mongodb",
        "sqlite",
        "redis",
        "oracle",
        "sql server",
      ],
      cloud: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform"],
      tools: ["git", "jenkins", "jira", "slack", "figma", "photoshop"],
      soft: [
        "leadership",
        "communication",
        "teamwork",
        "problem solving",
        "project management",
      ],
    };

    const foundSkills = new Set();
    const lowerText = text.toLowerCase();

    // Search for skills in the text
    Object.values(skillCategories)
      .flat()
      .forEach((skill) => {
        if (lowerText.includes(skill.toLowerCase())) {
          foundSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      });

    // Look for skills sections
    const skillsSectionMatch = text.match(
      /(?:skills|technologies|expertise|competencies):\s*([^\n]+)/gi
    );
    if (skillsSectionMatch) {
      skillsSectionMatch.forEach((section) => {
        const skillsText = section.split(":")[1];
        const skills = skillsText
          .split(/[,;|•\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2);
        skills.forEach((skill) => foundSkills.add(skill));
      });
    }

    extracted.skills = Array.from(foundSkills).slice(0, 15); // Limit to 15 skills

    // Extract name - look for patterns like "Name:" or capitalized words
    const namePatterns = [
      /(?:name|candidate|applicant):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.name = match[1].trim();
        break;
      }
    }

    console.log("🔧 Manual extraction result:", extracted);
    return extracted;
  }

  /**
   * Validate and clean extracted data
   * @param {Object} data - Raw extracted data
   * @returns {Object} - Validated and cleaned data
   */
  validateExtractedData(data) {
    const validated = {
      name: null,
      email: null,
      phone: null,
      skills: [],
      confidence: {
        name: 0,
        email: 0,
        phone: 0,
        skills: 0,
      },
      warnings: [],
    };

    // Validate and clean name
    if (data.name && typeof data.name === "string") {
      const cleanName = data.name.trim();

      // Check if it looks like a real name
      if (cleanName.length > 1 && cleanName.length < 100) {
        // Remove common resume words that might be mistaken for names
        const commonWords = [
          "resume",
          "cv",
          "curriculum",
          "vitae",
          "contact",
          "information",
        ];
        const isCommonWord = commonWords.some((word) =>
          cleanName.toLowerCase().includes(word)
        );

        if (!isCommonWord) {
          validated.name = this.capitalizeWords(cleanName);
          validated.confidence.name = this.calculateNameConfidence(cleanName);
        }
      }
    }

    // Validate and clean phone
    if (data.phone && typeof data.phone === "string") {
      const cleanPhone = data.phone.replace(/[^\d+]/g, "");

      // Check if it looks like a valid phone number
      if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
        validated.phone = this.formatPhoneNumber(cleanPhone);
        validated.confidence.phone = this.calculatePhoneConfidence(cleanPhone);
      } else {
        validated.warnings.push("Invalid phone number format detected");
      }
    }

    // Validate and clean skills
    if (data.skills && Array.isArray(data.skills)) {
      const cleanSkills = data.skills
        .filter((skill) => typeof skill === "string" && skill.trim().length > 1)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length < 50) // Remove overly long "skills"
        .slice(0, 20); // Limit to 20 skills

      validated.skills = [...new Set(cleanSkills)]; // Remove duplicates
      validated.confidence.skills = this.calculateSkillsConfidence(
        validated.skills
      );
    }
    if (data.email && typeof data.email === "string") {
      const cleanEmail = data.email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (emailRegex.test(cleanEmail)) {
        validated.email = cleanEmail;
        validated.confidence.email = this.calculateEmailConfidence(cleanEmail);
      } else {
        validated.warnings.push("Invalid email format detected");
      }
    }

    // Add warnings for low confidence
    if (validated.confidence.name < 0.5) {
      validated.warnings.push("Name extraction has low confidence");
    }

    if (validated.confidence.email < 0.5) {
      validated.warnings.push("Email extraction has low confidence");
    }

    if (validated.confidence.phone < 0.5 && validated.phone) {
      validated.warnings.push("Phone number extraction has low confidence");
    }

    if (validated.confidence.skills < 0.5 && validated.skills.length > 0) {
      validated.warnings.push("Skills extraction has low confidence");
    }

    // Add warning if critical information is missing
    if (!validated.name && !validated.email && !validated.phone) {
      validated.warnings.push(
        "No contact information could be extracted from the resume"
      );
    }

    return validated;
  }

  /**
   * Calculate confidence score for extracted name
   * @param {string} name - Extracted name
   * @returns {number} - Confidence score (0-1)
   */
  calculateNameConfidence(name) {
    let confidence = 0.5; // Base confidence

    // Increase confidence for multiple words (typical full name)
    const words = name.split(/\s+/);
    if (words.length >= 2) confidence += 0.3;

    // Increase confidence for proper capitalization
    const isProperlyCapitalized = words.every(
      (word) =>
        word.charAt(0).toUpperCase() === word.charAt(0) &&
        word.slice(1).toLowerCase() === word.slice(1)
    );
    if (isProperlyCapitalized) confidence += 0.2;

    // Decrease confidence for numbers or special characters
    if (/\d/.test(name) || /[^a-zA-Z\s\-\.]/.test(name)) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence score for extracted phone number
   * @param {string} phone - Extracted phone number
   * @returns {number} - Confidence score (0-1)
   */
  calculatePhoneConfidence(phone) {
    let confidence = 0.6; // Base confidence

    // Increase confidence for proper length
    if (phone.length >= 10 && phone.length <= 12) {
      confidence += 0.3;
    }

    // Increase confidence if it starts with country code
    if (
      phone.startsWith("+") ||
      (phone.length === 11 && phone.startsWith("1"))
    ) {
      confidence += 0.1;
    }

    // Decrease confidence for repeated digits
    if (/(\d)\1{4,}/.test(phone)) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence score for extracted skills
   * @param {string[]} skills - Extracted skills array
   * @returns {number} - Confidence score (0-1)
   */
  calculateSkillsConfidence(skills) {
    if (skills.length === 0) return 0;

    let confidence = 0.4; // Base confidence

    // Increase confidence based on number of skills
    if (skills.length >= 3) confidence += 0.2;
    if (skills.length >= 5) confidence += 0.2;

    // Increase confidence for known technical skills
    const technicalSkills = [
      "javascript",
      "python",
      "java",
      "react",
      "node.js",
      "sql",
      "aws",
      "docker",
    ];
    const foundTechnical = skills.filter((skill) =>
      technicalSkills.some((tech) =>
        skill.toLowerCase().includes(tech.toLowerCase())
      )
    );

    if (foundTechnical.length > 0) confidence += 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Format phone number consistently
   * @param {string} phone - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // If it starts with +, keep it
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // If it's a US number (10 digits), format as +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // If it's 11 digits and starts with 1, it's likely US
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`;
    }

    // Otherwise, return as is
    return cleaned;
  }

  /**
   * Calculate confidence score for extracted email
   * @param {string} email - Extracted email
   * @returns {number} - Confidence score (0-1)
   */
  calculateEmailConfidence(email) {
    let confidence = 0.7; // Base confidence for valid email format

    // Increase confidence for common personal email domains
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
    ];
    const domain = email.split("@")[1];

    if (personalDomains.includes(domain)) {
      confidence += 0.2;
    }

    // Decrease confidence for obvious company domains
    if (
      domain.includes("company") ||
      domain.includes("corp") ||
      domain.includes("inc")
    ) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Capitalize words properly
   * @param {string} text - Text to capitalize
   * @returns {string} - Properly capitalized text
   */
  capitalizeWords(text) {
    return text
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Generate suggested position based on resume content
   * @param {string} resumeText - Resume text to analyze
   * @returns {string|null} - Suggested position
   */
  suggestPosition(resumeText) {
    const text = resumeText.toLowerCase();

    const positionKeywords = {
      "software engineer": [
        "software",
        "engineer",
        "developer",
        "programming",
        "coding",
      ],
      "data scientist": [
        "data",
        "scientist",
        "analytics",
        "machine learning",
        "ai",
      ],
      "project manager": ["project", "manager", "management", "coordinator"],
      designer: ["design", "designer", "ui", "ux", "creative"],
      "marketing specialist": [
        "marketing",
        "digital",
        "social media",
        "campaigns",
      ],
      "sales representative": [
        "sales",
        "representative",
        "business development",
      ],
      "hr specialist": ["human resources", "hr", "recruitment", "talent"],
      "financial analyst": ["finance", "financial", "analyst", "accounting"],
    };

    for (const [position, keywords] of Object.entries(positionKeywords)) {
      const matches = keywords.filter((keyword) => text.includes(keyword));
      if (matches.length >= 2) {
        return position;
      }
    }

    return null;
  }
}

module.exports = new ResumeProcessor();
