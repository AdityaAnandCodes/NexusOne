import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting resume upload process");

    console.log("📁 Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const applicantName = formData.get("name") as string;
    const applicantEmail = formData.get("email") as string;
    const position = formData.get("position") as string;
    const phone = formData.get("phone") as string;
    const coverLetter = formData.get("coverLetter") as string;

    console.log(
      "📄 File check:",
      file
        ? `✅ File: ${file.name} (${file.size} bytes, ${file.type})`
        : "❌ No file"
    );

    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 }
      );
    }

    if (!applicantName || !applicantEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF and Word documents are allowed.",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB for GridFS
    console.log("🗄️ Connecting to MongoDB for GridFS...");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "resumes" });

    // Store resume file
    console.log("💾 Storing resume file...");
    const resumeBuffer = Buffer.from(await file.arrayBuffer());
    const resumeUploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        contentType: file.type,
        uploadDate: new Date(),
        originalName: file.name,
        fileSize: file.size,
        applicantName,
        applicantEmail,
        position: position || "Not specified",
        phone: phone || "Not provided",
        coverLetter: coverLetter || "",
        status: "pending", // pending, reviewed, rejected, shortlisted
        reviewedBy: null,
        reviewedAt: null,
        notes: "",
      },
    });

    return new Promise<NextResponse>((resolve, reject) => {
      resumeUploadStream.end(resumeBuffer);

      resumeUploadStream.on("finish", () => {
        const fileId = resumeUploadStream.id.toString();
        console.log(`✅ Resume stored successfully with ID: ${fileId}`);

        client.close();
        resolve(
          NextResponse.json({
            success: true,
            fileId,
            message:
              "Resume uploaded successfully! We'll review your application and get back to you soon.",
          })
        );
      });

      resumeUploadStream.on("error", (error) => {
        console.error("❌ Resume upload error:", error);
        client.close();
        resolve(
          NextResponse.json({ error: "Resume upload failed" }, { status: 500 })
        );
      });
    });
  } catch (error) {
    console.error("❌ Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}
