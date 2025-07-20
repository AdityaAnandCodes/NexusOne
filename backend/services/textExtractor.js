const pdf = require("pdf-parse");
const mammoth = require("mammoth");

class TextExtractor {
  /**
   *
   *
   * Extract text from various file types
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - Extracted text
   */

  validateFile(file) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check file size
    if (file.size === 0) {
      validation.isValid = false;
      validation.errors.push("File is empty");
    }

    // Check for suspiciously large files that might cause memory issues
    if (file.size > 20 * 1024 * 1024) {
      // 20MB
      validation.warnings.push(
        "Large file detected - extraction may take longer"
      );
    }

    // Check MIME type more strictly
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      validation.isValid = false;
      validation.errors.push(`Unsupported file type: ${file.mimetype}`);
    }

    // PDF specific validation
    if (file.mimetype === "application/pdf") {
      // Check for PDF magic number
      const buffer = file.buffer;
      if (buffer && buffer.length >= 4) {
        const header = buffer.toString("ascii", 0, 4);
        if (header !== "%PDF") {
          validation.isValid = false;
          validation.errors.push(
            "File claims to be PDF but does not have valid PDF header"
          );
        }
      }
    }

    return validation;
  }
  async extractText(file) {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(
          `File validation failed: ${validation.errors.join(", ")}`
        );
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        console.warn("⚠️ File validation warnings:", validation.warnings);
      }

      const { buffer, mimetype, originalname } = file;

      console.log(`🔍 Extracting text from ${originalname} (${mimetype})`);

      switch (mimetype) {
        case "application/pdf":
          return await this.extractFromPDF(buffer);

        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return await this.extractFromWord(buffer);

        case "text/plain":
          const text = buffer.toString("utf-8");
          if (!text.trim()) {
            throw new Error("Text file is empty");
          }
          return text;

        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromPDF(buffer) {
    try {
      console.log(
        `📄 Starting PDF extraction, buffer size: ${buffer.length} bytes`
      );

      // First attempt with default options
      let data;
      try {
        data = await pdf(buffer, {
          // Enhanced PDF parsing options
          max: 0, // No page limit
          version: "v1.10.88", // Specify version for consistency
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });
      } catch (primaryError) {
        console.warn(
          "⚠️ Primary PDF extraction failed, trying alternative method:",
          primaryError.message
        );

        // Fallback: Try with more permissive options
        try {
          data = await pdf(buffer, {
            max: 0,
            normalizeWhitespace: true,
            disableCombineTextItems: true,
            // More lenient parsing
            verbosity: 0,
          });
        } catch (fallbackError) {
          console.error(
            "❌ Fallback PDF extraction also failed:",
            fallbackError.message
          );

          // Last resort: Try to extract whatever is possible
          try {
            data = await pdf(buffer, {
              max: 10, // Limit to first 10 pages to avoid memory issues
              normalizeWhitespace: true,
              disableCombineTextItems: true,
            });
          } catch (finalError) {
            throw new Error(
              `PDF extraction failed after multiple attempts. The PDF may be corrupted, password-protected, or contain only images. Original error: ${primaryError.message}`
            );
          }
        }
      }

      let text = data.text || "";

      // Additional validation and cleaning
      if (!text || text.trim().length === 0) {
        // Check if PDF has metadata or info that might indicate content
        if (data.info) {
          console.log("📋 PDF Info:", {
            title: data.info.Title,
            pages: data.numpages,
            author: data.info.Author,
            creator: data.info.Creator,
          });
        }

        throw new Error(`PDF appears to be empty or contains no extractable text. This could be due to:
        - Scanned PDF (image-based) requiring OCR
        - Password protection
        - Corrupted file structure
        - PDF contains only images/graphics
        Pages: ${data.numpages || "unknown"}`);
      }

      // Clean and normalize the extracted text
      text = this.cleanText(text);

      console.log(
        `✅ PDF text extracted successfully: ${text.length} characters from ${
          data.numpages || "unknown"
        } pages`
      );

      // Log first 100 characters for debugging (without sensitive info)
      console.log(`📝 Text preview: "${text.substring(0, 100)}..."`);

      return text;
    } catch (error) {
      console.error("❌ PDF extraction error:", error);

      // Provide more specific error messages
      if (error.message.includes("Invalid PDF structure")) {
        throw new Error(
          "The PDF file appears to be corrupted or has an invalid structure. Please try re-saving or re-creating the PDF."
        );
      } else if (error.message.includes("password")) {
        throw new Error(
          "This PDF is password protected. Please provide an unprotected version."
        );
      } else if (error.message.includes("not a PDF")) {
        throw new Error("The uploaded file does not appear to be a valid PDF.");
      } else {
        throw new Error(`PDF extraction failed: ${error.message}`);
      }
    }
  }

  /**
   * Extract text from Word documents (.doc and .docx)
   * @param {Buffer} buffer - Word file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      if (!text || text.trim().length === 0) {
        throw new Error(
          "Word document appears to be empty or contains no extractable text"
        );
      }

      if (result.messages && result.messages.length > 0) {
        console.warn("Word extraction warnings:", result.messages);
      }

      console.log(`📝 Word text extracted: ${text.length} characters`);
      return text;
    } catch (error) {
      console.error("Word extraction error:", error);
      throw new Error(`Word document extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
      .trim();
  }

  /**
   * Validate extracted text quality
   * @param {string} text - Extracted text
   * @returns {Object} - Validation results
   */
  validateText(text) {
    const validation = {
      isValid: true,
      warnings: [],
      stats: {
        length: text.length,
        wordCount: text.split(/\s+/).length,
        lineCount: text.split("\n").length,
      },
    };

    // Check minimum length
    if (text.length < 50) {
      validation.warnings.push(
        "Text is very short, may not contain sufficient information"
      );
    }

    // Check for common resume keywords
    const resumeKeywords = [
      "experience",
      "education",
      "skills",
      "work",
      "job",
      "career",
      "professional",
    ];
    const foundKeywords = resumeKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length === 0) {
      validation.warnings.push(
        "Text does not appear to contain typical resume content"
      );
    }

    // Check for email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    validation.stats.emailCount = emails ? emails.length : 0;

    // Check for name patterns (capitalized words)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const names = text.match(namePattern);
    validation.stats.namePatternCount = names ? names.length : 0;

    return validation;
  }
}

module.exports = new TextExtractor();
