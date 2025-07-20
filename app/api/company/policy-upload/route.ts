import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting policy upload process");

    // Get session and user info
    const session = await auth();
    console.log(
      "🔐 Session check:",
      session ? "✅ Authenticated" : "❌ No session"
    );

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to main DB to get user's companyId
    console.log("🗄️ Connecting to main DB...");
    await connectToMainDB();

    const user = await User.findOne({ email: session.user?.email });
    console.log(
      "👤 User lookup:",
      user
        ? `✅ Found user with companyId: ${user.companyId}`
        : "❌ User not found"
    );

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    console.log("📁 Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log(
      "📄 File check:",
      file
        ? `✅ File: ${file.name} (${file.size} bytes, ${file.type})`
        : "❌ No file"
    );

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Connect to MongoDB for GridFS
    console.log("🗄️ Connecting to MongoDB for GridFS...");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    // Store original PDF first
    console.log("💾 Storing original PDF...");
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfUploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        contentType: file.type,
        companyId: user.companyId.toString(),
        uploadDate: new Date(),
        originalName: file.name,
        originalType: file.type,
        fileType: "original",
        fileSize: file.size,
      },
    });

    const pdfUploadPromise = new Promise<string>((resolve, reject) => {
      pdfUploadStream.end(pdfBuffer);

      pdfUploadStream.on("finish", () => {
        const pdfFileId = pdfUploadStream.id.toString();
        console.log(`✅ PDF stored successfully with ID: ${pdfFileId}`);
        resolve(pdfFileId);
      });

      pdfUploadStream.on("error", (error) => {
        console.error("❌ PDF upload error:", error);
        reject(error);
      });
    });

    // Create FormData for Express server
    console.log("📤 Preparing request to Express server...");
    const serverFormData = new FormData();
    serverFormData.append("file", file);

    // Call your Express server to extract text
    console.log(
      "🔗 Calling Express server at http://localhost:5000/api/extract-text"
    );

    let extractResponse;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      extractResponse = await fetch("http://localhost:5000/api/extract-text", {
        method: "POST",
        body: serverFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("📡 Express server response status:", extractResponse.status);
    } catch (fetchError) {
      console.error("❌ Failed to connect to Express server:", fetchError);

      if (
        typeof fetchError === "object" &&
        fetchError !== null &&
        "name" in fetchError &&
        (fetchError as { name?: unknown }).name === "AbortError"
      ) {
        return NextResponse.json(
          {
            error:
              "Text extraction timed out. Please try with a smaller file or contact support.",
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Failed to connect to text extraction service. Please ensure the extraction service is running.",
        },
        { status: 503 }
      );
    }

    if (!extractResponse.ok) {
      let errorData;
      try {
        errorData = await extractResponse.json();
      } catch (jsonError) {
        errorData = { error: await extractResponse.text() };
      }

      console.error("❌ Express server error response:", errorData);

      // Return user-friendly error messages
      const userMessage = errorData.error || "Text extraction failed";

      return NextResponse.json(
        {
          error: userMessage,
          details: errorData.details,
        },
        { status: extractResponse.status }
      );
    }

    let extractResult;
    try {
      extractResult = await extractResponse.json();
    } catch (jsonError) {
      console.error("❌ Failed to parse extraction response:", jsonError);
      return NextResponse.json(
        { error: "Invalid response from text extraction service" },
        { status: 502 }
      );
    }

    console.log("📝 Text extraction result:", {
      success: extractResult.success,
      textLength: extractResult.extractedText?.length || 0,
      warnings: extractResult.metadata?.warnings || [],
      error: extractResult.error,
    });

    if (!extractResult.success) {
      return NextResponse.json(
        {
          error: extractResult.error || "Text extraction failed",
          details: extractResult.message,
        },
        { status: 400 }
      );
    }

    const extractedText = extractResult.extractedText;
    console.log(
      `✅ Successfully extracted ${extractedText.length} characters from ${file.name}`
    );

    // Log any warnings
    if (extractResult.metadata?.warnings?.length > 0) {
      console.warn("⚠️ Extraction warnings:", extractResult.metadata.warnings);
    }

    // Wait for PDF upload to complete
    const pdfFileId = await pdfUploadPromise;

    // Store extracted text as a text file
    const textFileName = file.name.replace(/\.(pdf|doc|docx)$/i, ".txt");
    console.log(`💾 Storing extracted text as: ${textFileName}`);

    const textUploadStream = bucket.openUploadStream(textFileName, {
      metadata: {
        contentType: "text/plain",
        companyId: user.companyId.toString(),
        uploadDate: new Date(),
        originalName: file.name,
        originalType: file.type,
        fileType: "extracted_text",
        extractedText: true,
        textLength: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
        originalFileId: pdfFileId, // Link to original PDF
      },
    });

    return new Promise<NextResponse>((resolve) => {
      textUploadStream.end(Buffer.from(extractedText, "utf8"));

      textUploadStream.on("finish", () => {
        const textFileId = textUploadStream.id.toString();
        const pdfUrl = `/api/company/policy/${pdfFileId}`;
        const textUrl = `/api/company/policy/${textFileId}`;

        console.log(`✅ Text file stored successfully with ID: ${textFileId}`);

        client.close();
        resolve(
          NextResponse.json({
            pdfUrl,
            textUrl,
            pdfFileId,
            textFileId,
            message: "File processed and text extracted successfully",
            textLength: extractedText.length,
            wordCount: extractedText.split(/\s+/).length,
          })
        );
      });

      textUploadStream.on("error", (error) => {
        console.error("❌ GridFS text upload error:", error);
        client.close();
        resolve(
          NextResponse.json({ error: "Text upload failed" }, { status: 500 })
        );
      });
    });
  } catch (error) {
    console.error("❌ Policy upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload policy" },
      { status: 500 }
    );
  }
}
