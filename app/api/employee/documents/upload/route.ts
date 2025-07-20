import { auth } from "@/lib/auth";
import { User, EmployeeOnboarding } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting employee document upload process");

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

    // Only employees can upload documents
    if (user.role !== "employee") {
      return NextResponse.json(
        { error: "Only employees can upload documents" },
        { status: 403 }
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

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB for GridFS
    console.log("🗄️ Connecting to MongoDB for GridFS...");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "employee-documents" });

    console.log("💾 Storing employee document...");
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        contentType: file.type,
        companyId: user.companyId.toString(),
        employeeId: user.email, // Track which employee uploaded this
        uploadDate: new Date(),
        originalName: file.name,
        originalType: file.type,
        fileSize: file.size,
        status: "pending", // Initial status
      },
    });

    return new Promise<NextResponse>((resolve) => {
      uploadStream.end(buffer);

      uploadStream.on("finish", async () => {
        const fileId = uploadStream.id.toString();
        const documentUrl = `/api/employee/documents/${fileId}`;

        console.log(`✅ Document stored successfully with ID: ${fileId}`);

        try {
          // Update or create onboarding record with new document
          const documentData = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            status: "pending",
            url: documentUrl,
            verified: false,
          };

          await EmployeeOnboarding.findOneAndUpdate(
            {
              employeeId: user.email,
              companyId: user.companyId,
            },
            {
              $push: {
                documents: documentData,
              },
              $setOnInsert: {
                employeeId: user.email,
                companyId: user.companyId,
                status: "in_progress",
                startedAt: new Date(),
                tasks: [],
                policies: [],
                chatSessions: [],
              },
            },
            {
              upsert: true,
              new: true,
            }
          );

          console.log("✅ Onboarding record updated with new document");

          client.close();
          resolve(
            NextResponse.json({
              success: true,
              document: documentData,
              message: "Document uploaded successfully! Awaiting HR approval.",
            })
          );
        } catch (dbError) {
          console.error("❌ Database update error:", dbError);
          client.close();
          resolve(
            NextResponse.json(
              { error: "Document uploaded but failed to update records" },
              { status: 500 }
            )
          );
        }
      });

      uploadStream.on("error", (error) => {
        console.error("❌ GridFS upload error:", error);
        client.close();
        resolve(
          NextResponse.json(
            { error: "Failed to upload document" },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("❌ Employee document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
