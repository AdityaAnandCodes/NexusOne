// First, install the required packages:
// npm install pdf-parse mammoth

// Create a new file: /lib/textExtractor.ts
import pdf from "pdf-parse";
import * as mammoth from "mammoth";

interface FileForExtraction {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  stats: {
    length: number;
    wordCount: number;
    lineCount: number;
    emailCount: number;
    namePatternCount: number;
  };
}

class TextExtractor {
  /**
   * Extract text from various file types
   * @param file - File object with buffer and mimetype
   * @returns Extracted text
   */
  async extractText(file: FileForExtraction): Promise<string> {
    try {
      const { buffer, mimetype, originalname } = file;

      console.log(`🔍 Extracting text from ${originalname} (${mimetype})`);

      switch (mimetype) {
        case "application/pdf":
          return await this.extractFromPDF(buffer);

        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return await this.extractFromWord(buffer);

        case "text/plain":
          return buffer.toString("utf-8");

        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error("Text extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to extract text: ${errorMessage}`);
    }
  }

  /**
   * Extract text from PDF files
   * @param buffer - PDF file buffer
   * @returns Extracted text
   */
  async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        throw new Error(
          "PDF appears to be empty or contains no extractable text"
        );
      }

      console.log(`📄 PDF text extracted: ${text.length} characters`);
      return this.cleanText(text);
    } catch (error) {
      console.error("PDF extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`PDF extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Extract text from Word documents (.doc and .docx)
   * @param buffer - Word file buffer
   * @returns Extracted text
   */
  async extractFromWord(buffer: Buffer): Promise<string> {
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
      return this.cleanText(text);
    } catch (error) {
      console.error("Word extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Word document extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param text - Raw extracted text
   * @returns Cleaned text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
      .trim();
  }

  /**
   * Validate extracted text quality
   * @param text - Extracted text
   * @returns Validation results
   */
  validateText(text: string): ValidationResult {
    const validation: ValidationResult = {
      isValid: true,
      warnings: [],
      stats: {
        length: text.length,
        wordCount: text.split(/\s+/).length,
        lineCount: text.split("\n").length,
        emailCount: 0,
        namePatternCount: 0,
      },
    };

    // Check minimum length
    if (text.length < 50) {
      validation.warnings.push(
        "Text is very short, may not contain sufficient information"
      );
    }

    // Check for common policy keywords
    const policyKeywords = [
      "policy",
      "procedure",
      "guideline",
      "rule",
      "regulation",
      "compliance",
      "standard",
    ];
    const foundKeywords = policyKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length === 0) {
      validation.warnings.push(
        "Text does not appear to contain typical policy content"
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

export default new TextExtractor();

// Now modify your /api/company/policy-upload/route.ts
import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";

// Import the text extractor
import textExtractor from "@/lib/textExtractor";

export async function POST(request: NextRequest) {
  try {
    // Get session and user info
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to main DB to get user's companyId
    await connectToMainDB();
    const user = await User.findOne({ email: session.user?.email });
    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create file object for text extractor
    const fileForExtractor = {
      buffer: buffer,
      mimetype: file.type,
      originalname: file.name,
    };

    // Extract text using the working text extractor
    let extractedText = "";
    try {
      extractedText = await textExtractor.extractText(fileForExtractor);

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "No text content could be extracted from the file" },
          { status: 400 }
        );
      }

      console.log(
        `✅ Successfully extracted ${extractedText.length} characters from ${file.name}`
      );

      // Optional: Validate the extracted text
      const validation = textExtractor.validateText(extractedText);
      if (validation.warnings.length > 0) {
        console.warn("Text validation warnings:", validation.warnings);
      }
    } catch (error) {
      console.error("Text extraction failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: `Text extraction failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Connect to MongoDB for GridFS
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    // Store extracted text as a text file
    const textFileName = file.name.replace(/\.(pdf|doc|docx)$/i, ".txt");
    const uploadStream = bucket.openUploadStream(textFileName, {
      metadata: {
        contentType: "text/plain",
        companyId: user.companyId.toString(),
        uploadDate: new Date(),
        originalName: file.name,
        originalType: file.type,
        extractedText: true,
        textLength: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
      },
    });

    return new Promise((resolve) => {
      uploadStream.end(Buffer.from(extractedText, "utf8"));

      uploadStream.on("finish", () => {
        const fileId = uploadStream.id.toString();
        const url = `/api/company/policy/${fileId}`;

        client.close();
        resolve(
          NextResponse.json({
            url,
            fileId,
            message: "File processed and text extracted successfully",
            textLength: extractedText.length,
            wordCount: extractedText.split(/\s+/).length,
          })
        );
      });

      uploadStream.on("error", (error) => {
        console.error("Upload error:", error);
        client.close();
        resolve(NextResponse.json({ error: "Upload failed" }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error("Policy upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload policy" },
      { status: 500 }
    );
  }
}
