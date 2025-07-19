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
      extractResponse = await fetch("http://localhost:5000/api/extract-text", {
        method: "POST",
        body: serverFormData,
      });
      console.log("📡 Express server response status:", extractResponse.status);
    } catch (fetchError) {
      console.error("❌ Failed to connect to Express server:", fetchError);
      return NextResponse.json(
        {
          error:
            "Failed to connect to text extraction service. Make sure Express server is running on port 5000.",
        },
        { status: 500 }
      );
    }

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error("❌ Express server error response:", errorText);
      return NextResponse.json(
        { error: `Text extraction service error: ${errorText}` },
        { status: extractResponse.status }
      );
    }

    const extractResult = await extractResponse.json();
    console.log("📝 Text extraction result:", {
      success: extractResult.success,
      textLength: extractResult.extractedText?.length || 0,
      error: extractResult.error,
    });

    if (!extractResult.success) {
      return NextResponse.json(
        { error: `Text extraction failed: ${extractResult.error}` },
        { status: 400 }
      );
    }

    const extractedText = extractResult.extractedText;
    console.log(
      `✅ Successfully extracted ${extractedText.length} characters from ${file.name}`
    );

    // Connect to MongoDB for GridFS
    console.log("🗄️ Connecting to MongoDB for GridFS...");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    // Store extracted text as a text file
    const textFileName = file.name.replace(/\.(pdf|doc|docx)$/i, ".txt");
    console.log(`💾 Storing as: ${textFileName}`);

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

        console.log(`✅ File stored successfully with ID: ${fileId}`);

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
        console.error("❌ GridFS upload error:", error);
        client.close();
        resolve(NextResponse.json({ error: "Upload failed" }, { status: 500 }));
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
