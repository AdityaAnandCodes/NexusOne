const express = require("express");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const resumeProcessor = require("./services/resumeProcessor");
const textExtractor = require("./services/textExtractor");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."
        )
      );
    }
  },
});
// Add this endpoint after your existing endpoints (after /api/chat-process)

// Text extraction endpoint that returns extracted text for Next.js to handle DB storage
app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
      });
    }

    console.log(
      `🔍 Extracting text from: ${req.file.originalname} (${req.file.mimetype})`
    );

    // Extract text using your existing text extractor
    let extractedText = "";
    try {
      extractedText = await textExtractor.extractText(req.file);

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "No text content could be extracted from the file",
        });
      }

      console.log(
        `✅ Successfully extracted ${extractedText.length} characters from ${req.file.originalname}`
      );
    } catch (error) {
      console.error("Text extraction failed:", error);
      return res.status(400).json({
        success: false,
        error: `Text extraction failed: ${error.message}`,
      });
    }

    // Clean the text if cleaner is available
    const cleanedText = textExtractor.cleanText
      ? textExtractor.cleanText(extractedText)
      : extractedText;

    // Return the extracted text for Next.js to handle
    res.json({
      success: true,
      extractedText: cleanedText,
      metadata: {
        filename: req.file.originalname,
        originalType: req.file.mimetype,
        textLength: cleanedText.length,
        wordCount: cleanedText.split(/\s+/).filter((word) => word.length > 0)
          .length,
        extractedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Text extraction error:", error);
    res.status(500).json({
      success: false,
      error: "Text extraction failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update your console.log in app.listen to include:
/*
console.log(`📝 Text extraction: http://localhost:${PORT}/api/extract-text`);
*/
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Resume Processing API is running",
    timestamp: new Date().toISOString(),
  });
});

// Resume processing endpoint
app.post("/api/process-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        message: "Please upload a resume file (PDF, DOC, DOCX, or TXT)",
      });
    }

    console.log(
      `📄 Processing resume: ${req.file.originalname} (${req.file.size} bytes)`
    );

    // Extract text from the uploaded file
    const extractedText = await textExtractor.extractText(req.file);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: "Could not extract text from resume",
        message: "The uploaded file appears to be empty or corrupted",
      });
    }

    console.log(`📝 Extracted ${extractedText.length} characters from resume`);

    // Process resume with Gemini AI
    const processedData = await resumeProcessor.processResume(
      extractedText,
      genAI
    );

    console.log("🤖 Gemini processing completed:", processedData);

    res.json({
      success: true,
      data: processedData,
      metadata: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        extractedTextLength: extractedText.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Resume processing error:", error);

    // Handle specific error types
    if (error.message.includes("Invalid file type")) {
      return res.status(400).json({
        error: "Invalid file type",
        message: error.message,
      });
    }

    if (error.message.includes("File too large")) {
      return res.status(400).json({
        error: "File too large",
        message: "Please upload a file smaller than 10MB",
      });
    }

    res.status(500).json({
      error: "Resume processing failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Add this endpoint for policy text extraction
app.post("/api/extract-policy-text", async (req, res) => {
  try {
    const { buffer, contentType, query } = req.body;

    if (!buffer) {
      return res.status(400).json({ error: "No buffer provided" });
    }

    const policyExtractor = require("./services/policyExtractor");
    const bufferData = Buffer.from(buffer, "base64");

    let extractedText = await policyExtractor.extractPolicyText(
      bufferData,
      contentType
    );

    // If query provided, extract relevant sections
    if (query) {
      extractedText = policyExtractor.extractKeySections(extractedText, query);
    }

    res.json({
      success: true,
      text: extractedText,
    });
  } catch (error) {
    console.error("Policy extraction error:", error);
    res.status(500).json({
      error: "Policy extraction failed",
      message: error.message,
    });
  }
});

// Add after existing endpoints, before error handling middleware

// Chat processing endpoint with policy analysis
// Enhanced chat processing endpoint with better company context
app.post("/api/chat-process", async (req, res) => {
  try {
    const {
      message,
      policyContext,
      companyContext,
      sessionId,
      userId,
      userName,
      companyName,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(
      `💬 Processing chat message from ${userName} (${userId}) at ${companyName}: ${message.substring(
        0,
        50
      )}...`
    );
    console.log(
      `📄 Policy context available: ${policyContext ? "Yes" : "No"} (${
        policyContext?.length || 0
      } chars)`
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Enhanced prompt construction with company-specific context
    let prompt = `You are an AI HR onboarding assistant for ${companyName}. You're helping ${userName} with their onboarding process.

COMPANY CONTEXT:
${companyContext}

USER QUESTION: "${message}"`;

    if (policyContext && policyContext.trim()) {
      prompt += `

RELEVANT COMPANY DOCUMENTS AND POLICIES:
${policyContext}

IMPORTANT INSTRUCTIONS:
- Use the provided company documents and policies to give specific, accurate answers
- When referencing policies, mention the specific document name
- If the user asks about company handbook, benefits, or policies, extract key information from the provided documents
- Provide specific details like policy numbers, dates, procedures when available
- If information is not in the provided documents, clearly state that and suggest they contact HR for more details`;
    } else {
      prompt += `

Note: No specific company policy documents were found for this query. Provide general guidance and suggest the user check their company handbook or contact HR for specific policy details.`;
    }

    prompt += `

RESPONSE GUIDELINES:
- Be friendly, professional, and helpful
- Keep responses clear and well-organized
- Use bullet points or numbered lists for multiple items
- If providing policy information, cite the specific document
- Always end with an offer to help with other questions
- Maximum response length: 500 words`;

    console.log(`🎯 Generated prompt length: ${prompt.length} characters`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("🤖 Chat processing completed");
    console.log(`📝 Response length: ${responseText.length} characters`);

    res.json({
      success: true,
      response: responseText,
      sessionId: sessionId || `session_${Date.now()}`,
      metadata: {
        hasPolicy: !!policyContext,
        policyLength: policyContext?.length || 0,
        companyName: companyName,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Chat processing error:", error);

    res.status(500).json({
      error: "Chat processing failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Sorry, I'm having trouble right now. Please try again.",
    });
  }
});

// Test Gemini endpoint
app.post("/api/test-gemini", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = `Extract name and email from this text: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      input: text,
      output: response.text(),
    });
  } catch (error) {
    console.error("Gemini test error:", error);
    res.status(500).json({
      error: "Gemini test failed",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "Please upload a file smaller than 10MB",
      });
    }
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Processing API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `📄 Resume processing: http://localhost:${PORT}/api/process-resume`
  );
  console.log(`🧪 Gemini test: http://localhost:${PORT}/api/test-gemini`);
});

module.exports = app;
