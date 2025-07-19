import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import { Company, User, EmployeeOnboarding } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";

// Add this interface for policy documents
interface PolicyDocument {
  _id: any;
  filename: string;
  metadata?: {
    contentType: string;
    uploadDate: Date;
    category?: string;
  };
}
interface CustomPolicy {
  fileId: any;
  [key: string]: any;
}

interface PolicyIds {
  handookFileId?: any;
  benefitsFileId?: any;
  codeOfConductFileId?: any;
  privacyPolicyFileId?: any;
  safePolicyFileId?: any;
  customPolicies?: CustomPolicy[];
}

export async function POST(request: NextRequest) {
  try {
    // Use auth() instead of getServerSession() for NextAuth v5
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, sessionId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Connect to main database to get user and company info
    await connectToMainDB();

    // Get user information
    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: "User not associated with a company" },
        { status: 400 }
      );
    }

    console.log(`🔍 Debug Information:`);
    console.log(`- User Company ID: ${user.companyId}`);

    console.log(`- Message: "${message}"`);

    // Get company information with policies
    const company = await Company.findById(user.companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    console.log("🔍 Company policies debug:", {
      companyId: user.companyId,
      companyIdType: typeof user.companyId,
      policies: company.onboarding?.policies,
      handookFileId: company.onboarding?.policies?.handookFileId,
      customPolicies: company.onboarding?.policies?.customPolicies?.length || 0,
    });
    console.log(`🏢 Processing chat for company: ${company.name}`);
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`💬 Message: ${message.substring(0, 100)}...`);

    // Connect to MongoDB for file operations
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Check if message is asking about policies
    const isPolicyQuery =
      message.toLowerCase().includes("policy") ||
      message.toLowerCase().includes("benefit") ||
      message.toLowerCase().includes("handbook") ||
      message.toLowerCase().includes("code of conduct") ||
      message.toLowerCase().includes("privacy") ||
      message.toLowerCase().includes("safe") ||
      message.toLowerCase().includes("manual") ||
      message.toLowerCase().includes("guide");

    let policyContext = "";
    let companyContext = `Company: ${company.name}\n`;

    if (company.description) {
      companyContext += `About: ${company.description}\n`;
    }

    companyContext += `Industry: ${company.industry || "Not specified"}\n`;
    // Replace the policy file retrieval section in your chat API route
    // Around line 70-90 in your current code

    if (isPolicyQuery) {
      console.log("📋 Detected policy query, retrieving company documents...");

      const bucket = new GridFSBucket(db, { bucketName: "policies" });
      if (process.env.NODE_ENV === "development") {
        await debugGridFSFiles(db, user.companyId.toString());
      }

      // Query files by companyId in metadata - convert to string for consistency
      const policyFiles = await bucket
        .find({
          "metadata.companyId": user.companyId.toString(),
        })
        .toArray();

      const filesCollection = db.collection("policies.files");
      const chunksCollection = db.collection("policies.chunks");

      for (const file of policyFiles) {
        const fileRecord = await filesCollection.findOne({ _id: file._id });
        const chunkCount = await chunksCollection.countDocuments({
          files_id: file._id,
        });

        console.log(`🔍 File Debug - ${file.filename}:`);
        console.log(`  - File record exists: ${!!fileRecord}`);
        console.log(
          `  - Expected chunks: ${
            fileRecord?.chunkSize
              ? Math.ceil(fileRecord.length / fileRecord.chunkSize)
              : "unknown"
          }`
        );
        console.log(`  - Actual chunks: ${chunkCount}`);
        console.log(`  - File length: ${fileRecord?.length || 0} bytes`);
      }

      console.log(`📁 Found ${policyFiles.length} policy files for company`);
      console.log(
        "📄 Policy files:",
        policyFiles.map((f) => ({
          filename: f.filename,
          id: f._id,
          companyId: f.metadata?.companyId,
        }))
      );

      if (policyFiles.length > 0) {
        for (const file of policyFiles) {
          if (shouldIncludePolicy(message, file.filename)) {
            console.log(`📖 Processing: ${file.filename} (ID: ${file._id})`);

            // Validate file before processing
            const validation = await validateGridFSFile(
              db,
              file._id.toString()
            );

            console.log(
              `🔍 Validation result for ${file.filename}:`,
              validation
            );

            if (!validation.valid) {
              console.log(
                `❌ File ${file.filename} failed validation - ${
                  validation.info?.hasChunks
                    ? "chunk count mismatch"
                    : "no chunks found"
                }`
              );
              policyContext += `\n\n--- ${file.filename} ---\n[File data is missing or corrupted. Please re-upload this document through the admin panel.]`;
              continue;
            }

            console.log(`✅ File validation passed for ${file.filename}`);

            const policyText = await extractPolicyText(
              bucket,
              file._id.toString(),
              message
            );

            if (
              policyText &&
              policyText.trim() &&
              !policyText.includes("[File download error")
            ) {
              policyContext += `\n\n--- ${file.filename} ---\n${policyText}`;
              console.log(
                `📋 Added content from ${file.filename} (${policyText.length} chars)`
              );
            } else {
              console.log(
                `⚠️ No valid content extracted from ${file.filename}`
              );
              policyContext += `\n\n--- ${file.filename} ---\n[File exists but content could not be extracted. Please re-upload this document.]`;
            }
          }
        }
      }
    }

    console.log(`📝 Policy context length: ${policyContext.length} characters`);

    // Send to Gemini server for processing
    const geminiResponse = await fetch(
      `${process.env.GEMINI_SERVER_URL}/api/chat-process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          policyContext,
          companyContext,
          sessionId,
          userId: session.user?.email,
          userName: user.name,
          companyName: company.name,
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error("Failed to process with Gemini");
    }

    const result = await geminiResponse.json();

    // Get/update onboarding status
    const onboardingStatus = await getOnboardingStatus(
      user._id,
      user.companyId
    );

    await client.close();

    return NextResponse.json({
      response: result.response,
      sessionId: result.sessionId || sessionId || generateSessionId(),
      onboardingStatus,
      debugInfo:
        process.env.NODE_ENV === "development"
          ? {
              companyName: company.name,
              policyContextLength: policyContext.length,
              foundPolicyFiles: policyContext ? true : false,
              userRole: user.role,
            }
          : undefined,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

async function debugGridFSFiles(db: any, companyId: string) {
  console.log(`🔍 GridFS Debug for company ${companyId}:`);

  const filesCollection = db.collection("policies.files");
  const chunksCollection = db.collection("policies.chunks");

  // Get all files for this company
  const files = await filesCollection
    .find({
      "metadata.companyId": companyId.toString(),
    })
    .toArray();

  console.log(`📁 Found ${files.length} file records`);

  for (const file of files) {
    const chunkCount = await chunksCollection.countDocuments({
      files_id: file._id,
    });
    const expectedChunks = Math.ceil(file.length / (file.chunkSize || 261120));

    console.log(`📄 ${file.filename}:`);
    console.log(`   - ID: ${file._id}`);
    console.log(`   - Size: ${file.length} bytes`);
    console.log(`   - Upload Date: ${file.uploadDate}`);
    console.log(`   - Chunk Size: ${file.chunkSize || 261120}`);
    console.log(`   - Expected Chunks: ${expectedChunks}`);
    console.log(`   - Actual Chunks: ${chunkCount}`);
    console.log(
      `   - Status: ${
        chunkCount === expectedChunks && chunkCount > 0
          ? "✅ Complete"
          : "❌ Incomplete"
      }`
    );
  }

  // Check total chunks in bucket
  const totalChunks = await chunksCollection.countDocuments({});
  console.log(`📦 Total chunks in policies bucket: ${totalChunks}`);
}

async function fallbackPDFExtraction(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // Simple text extraction attempt
    const text = buffer.toString("utf8");

    // Check if it looks like a PDF
    if (text.startsWith("%PDF")) {
      return `[PDF file detected: ${filename}. Text extraction requires additional processing. Please contact IT to enable PDF text extraction.]`;
    }

    // If it's plain text, return it
    if (text.trim()) {
      return text.substring(0, 5000); // Limit to 5000 chars
    }

    return `[No readable text found in ${filename}]`;
  } catch (error) {
    return `[Error reading ${filename}: ${error}]`;
  }
}
// Enhanced helper function to determine if a policy should be included
function shouldIncludePolicy(message: string, filename: string): boolean {
  const messageLower = message.toLowerCase();
  const filenameLower = filename.toLowerCase();

  // More comprehensive policy matching
  const policyKeywords = {
    handbook: [
      "handbook",
      "manual",
      "guide",
      "employee guide",
      "employee handbook",
    ],
    benefits: [
      "benefit",
      "benefits",
      "compensation",
      "salary",
      "insurance",
      "vacation",
      "pto",
      "leave",
      "health",
      "dental",
      "retirement",
      "401k",
    ],
    conduct: ["conduct", "behavior", "ethics", "code", "code of conduct"],
    privacy: ["privacy", "data", "confidential", "privacy policy"],
    safety: ["safety", "safe", "security", "emergency", "workplace safety"],
    hr: ["hr", "human resources", "personnel", "employee"],
    policy: ["policy", "policies", "procedure", "procedures"],
  };

  // If message is very general, include all policies
  const generalQueries = [
    "tell me about",
    "what are",
    "show me",
    "policies",
    "documents",
  ];
  const isGeneralQuery = generalQueries.some((query) =>
    messageLower.includes(query)
  );

  if (isGeneralQuery) {
    return true;
  }

  // Check specific policy matching
  for (const [category, keywords] of Object.entries(policyKeywords)) {
    const messageContainsKeyword = keywords.some((keyword) =>
      messageLower.includes(keyword)
    );
    const filenameContainsCategory =
      filenameLower.includes(category) ||
      keywords.some((keyword) => filenameLower.includes(keyword));

    if (messageContainsKeyword || filenameContainsCategory) {
      return true;
    }
  }

  // Default to include if we're not sure
  return true;
}
// Helper function to check if FAQ should be included
function shouldIncludeFAQ(message: string, question: string): boolean {
  const messageLower = message.toLowerCase();
  const questionLower = question.toLowerCase();

  // Simple keyword matching - can be enhanced with more sophisticated matching
  const messageWords = messageLower.split(/\s+/);
  const questionWords = questionLower.split(/\s+/);

  const commonWords = messageWords.filter(
    (word) => questionWords.includes(word) && word.length > 3
  );

  return commonWords.length >= 2;
}

// Enhanced helper function to extract text from policy document
async function extractPolicyText(
  bucket: GridFSBucket,
  fileId: string,
  query: string
): Promise<string> {
  try {
    // Convert string to ObjectId for GridFS operations
    const objectId = new ObjectId(fileId);

    console.log(`🔍 Attempting to download file with ObjectId: ${objectId}`);

    const downloadStream = bucket.openDownloadStream(objectId);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => {
        console.log(`📦 Received chunk of size: ${chunk.length}`);
        chunks.push(chunk);
      });

      downloadStream.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          console.log(
            `✅ Downloaded complete file, total size: ${buffer.length} bytes`
          );

          if (buffer.length === 0) {
            console.log(`⚠️ Downloaded file is empty`);
            resolve("[File appears to be empty]");
            return;
          }

          // Get file info to determine content type
          const fileInfo = await bucket.find({ _id: objectId }).toArray();
          const contentType = fileInfo[0]?.contentType || "application/pdf";

          console.log(
            `📄 Processing ${fileInfo[0]?.filename}, size: ${buffer.length} bytes, type: ${contentType}`
          );

          // Send to your Express server for PDF text extraction
          const extractResponse = await fetch(
            `${process.env.GEMINI_SERVER_URL}/api/extract-policy-text`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                buffer: buffer.toString("base64"),
                contentType: contentType,
                filename: fileInfo[0]?.filename || "unknown.pdf",
                query,
              }),
            }
          );

          if (extractResponse.ok) {
            const result = await extractResponse.json();
            console.log(
              `✅ Extracted ${result.text?.length || 0} characters from ${
                fileInfo[0]?.filename
              }`
            );
            resolve(result.text || "");
          } else {
            const errorResult = await extractResponse.text();
            console.log(
              `⚠️ PDF extraction failed for ${fileInfo[0]?.filename}:`,
              errorResult
            );

            // Fallback: check if it's actually text content
            const textContent = buffer.toString("utf8");
            if (textContent.trim() && !textContent.startsWith("%PDF")) {
              console.log(
                `📝 Using fallback text extraction (${textContent.length} chars)`
              );
              resolve(textContent.substring(0, 5000));
            } else {
              resolve(
                `[PDF extraction service unavailable for ${fileInfo[0]?.filename}]`
              );
            }
          }
        } catch (error) {
          console.error("Error processing downloaded file:", error);
          resolve(`[Error processing file - ${error}]`);
        }
      });

      downloadStream.on("error", (error) => {
        console.error("GridFS download error:", error);
        resolve(`[File download error - ${error.message}]`);
      });
    });
  } catch (error) {
    console.error("Error in extractPolicyText:", error);
    return `[Error accessing file - ${error}]`;
  }
}

async function validateGridFSFile(
  db: any,
  fileId: string
): Promise<{ valid: boolean; info?: any }> {
  try {
    const objectId = new ObjectId(fileId);
    const filesCollection = db.collection("policies.files");
    const chunksCollection = db.collection("policies.chunks");

    const fileRecord = await filesCollection.findOne({ _id: objectId });
    if (!fileRecord) {
      console.log(`❌ No file record found for ${fileId}`);
      return { valid: false };
    }

    // Use ObjectId for chunk query too
    const chunkCount = await chunksCollection.countDocuments({
      files_id: objectId,
    });
    const expectedChunks = Math.ceil(
      fileRecord.length / (fileRecord.chunkSize || 261120)
    );

    console.log(
      `🔍 Validation for ${fileRecord.filename}: chunks=${chunkCount}, expected=${expectedChunks}, size=${fileRecord.length}`
    );

    // File is valid only if it has the expected number of chunks AND at least 1 chunk
    const isValid = chunkCount > 0 && chunkCount === expectedChunks;

    return {
      valid: isValid,
      info: {
        filename: fileRecord.filename,
        size: fileRecord.length,
        chunks: chunkCount,
        expectedChunks,
        hasMetadata: true,
        hasChunks: chunkCount > 0,
      },
    };
  } catch (error) {
    console.log(`❌ Validation error for ${fileId}:`, error);
    return { valid: false };
  }
}
// Enhanced helper function to get onboarding status
async function getOnboardingStatus(userId: string, companyId: string) {
  try {
    const onboarding = await EmployeeOnboarding.findOne({
      employeeId: userId,
      companyId: companyId,
    });

    if (!onboarding) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPolicies: 0,
        acknowledgedPolicies: 0,
      };
    }

    interface OnboardingTask {
      _id?: any;
      title: string;
      description?: string;
      status: "completed" | "pending" | "in-progress" | string;
      [key: string]: any;
    }

    interface OnboardingPolicy {
      _id?: any;
      acknowledged: boolean;
      [key: string]: any;
    }

    const completedTasksCount =
      (onboarding.tasks as OnboardingTask[])?.filter(
        (task: OnboardingTask) => task.status === "completed"
      ).length || 0;

    const acknowledgedPoliciesCount =
      (onboarding.policies as OnboardingPolicy[])?.filter(
        (policy: OnboardingPolicy) => policy.acknowledged
      ).length || 0;

    return {
      totalTasks: onboarding.tasks?.length || 0,
      completedTasks: completedTasksCount,
      totalPolicies: onboarding.policies?.length || 0,
      acknowledgedPolicies: acknowledgedPoliciesCount,
    };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return {
      totalTasks: 0,
      completedTasks: 0,
      totalPolicies: 0,
      acknowledgedPolicies: 0,
    };
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
