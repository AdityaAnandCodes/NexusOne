const pdf = require("pdf-parse");
const mammoth = require("mammoth");

class PolicyExtractor {
  async extractPolicyText(buffer, contentType) {
    try {
      switch (contentType) {
        case "application/pdf":
          return await this.extractFromPDF(buffer);

        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return await this.extractFromWord(buffer);

        case "text/plain":
          return buffer.toString("utf8");

        default:
          // Try to extract as text
          return buffer.toString("utf8");
      }
    } catch (error) {
      console.error("Policy extraction error:", error);
      // Fallback to raw text
      return buffer.toString("utf8").substring(0, 3000);
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw error;
    }
  }

  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error("Word extraction error:", error);
      throw error;
    }
  }

  // Extract key sections for benefits/policy summaries
  extractKeySections(text, query) {
    const sections = [];
    const lines = text.split("\n");
    let currentSection = [];
    let inRelevantSection = false;

    const keywords = this.getKeywords(query);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line starts a new section
      if (this.isHeaderLine(line)) {
        // Save previous section if it was relevant
        if (inRelevantSection && currentSection.length > 0) {
          sections.push(currentSection.join("\n"));
        }

        // Check if new section is relevant
        inRelevantSection = keywords.some((keyword) =>
          line.toLowerCase().includes(keyword)
        );
        currentSection = [line];
      } else if (line.length > 0) {
        currentSection.push(line);

        // Also check content for relevance
        if (!inRelevantSection) {
          inRelevantSection = keywords.some((keyword) =>
            line.toLowerCase().includes(keyword)
          );
        }
      }
    }

    // Add final section if relevant
    if (inRelevantSection && currentSection.length > 0) {
      sections.push(currentSection.join("\n"));
    }

    return sections.length > 0
      ? sections.join("\n\n")
      : text.substring(0, 2000);
  }

  getKeywords(query) {
    const queryLower = query.toLowerCase();
    const keywords = [];

    if (queryLower.includes("benefit")) {
      keywords.push(
        "benefit",
        "health",
        "insurance",
        "vacation",
        "pto",
        "medical",
        "dental"
      );
    }
    if (queryLower.includes("policy")) {
      keywords.push("policy", "procedure", "rule", "guideline");
    }
    if (queryLower.includes("leave")) {
      keywords.push(
        "leave",
        "vacation",
        "pto",
        "sick",
        "maternity",
        "paternity"
      );
    }

    return keywords;
  }

  isHeaderLine(line) {
    // Simple heuristics for detecting headers
    return (
      line.length < 80 &&
      (line.match(/^[A-Z\s\d\.\-:]+$/) ||
        (line.includes(":") && line.length < 50) ||
        line.match(/^\d+\./) ||
        line.match(/^[A-Z][a-z\s]+$/))
    );
  }
}

module.exports = new PolicyExtractor();
