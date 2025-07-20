import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();
    const user = await User.findOne({ email: session.user?.email });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    // Get all files for this company
    const files = await bucket
      .find({
        "metadata.companyId": user.companyId.toString(),
      })
      .toArray();

    // Group files by original file (PDF + its extracted text)
    const groupedFiles = new Map();

    files.forEach((file) => {
      const metadata = file.metadata;

      if (metadata && metadata.fileType === "original") {
        // This is an original PDF
        groupedFiles.set(file._id.toString(), {
          id: file._id.toString(),
          filename: file.filename,
          uploadDate: file.uploadDate,
          contentType: metadata.contentType,
          fileSize: metadata.fileSize,
          originalName: metadata.originalName,
          type: "pdf",
          url: `/api/company/policy/${file._id.toString()}`,
          textFileId: null,
          textUrl: null,
          textLength: null,
          wordCount: null,
        });
      } else if (
        metadata &&
        metadata.fileType === "extracted_text" &&
        metadata.originalFileId
      ) {
        // This is extracted text, link it to its original PDF
        const originalId = metadata.originalFileId;
        if (groupedFiles.has(originalId)) {
          const pdfFile = groupedFiles.get(originalId);
          pdfFile.textFileId = file._id.toString();
          pdfFile.textUrl = `/api/company/policy/${file._id.toString()}`;
          pdfFile.textLength = metadata.textLength;
          pdfFile.wordCount = metadata.wordCount;
        }
      }
    });

    const result = Array.from(groupedFiles.values()).sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    client.close();

    return NextResponse.json({
      files: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}
