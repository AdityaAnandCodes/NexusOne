import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { MongoClient, GridFSBucket } from "mongodb";
import { hasHRAccess } from "@/lib/utils/roleCheck";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();
    const user = await User.findOne({ email: session.user?.email });

    if (!user || !hasHRAccess(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "resumes" });

    const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();

    const resumes = files.map((file) => ({
      id: file._id.toString(),
      filename: file.filename,
      uploadDate: file.uploadDate,
      fileSize: file.length,
      applicantName: file.metadata?.applicantName,
      applicantEmail: file.metadata?.applicantEmail,
      position: file.metadata?.position,
      phone: file.metadata?.phone,
      coverLetter: file.metadata?.coverLetter,
      status: file.metadata?.status || "pending",
      reviewedBy: file.metadata?.reviewedBy,
      reviewedAt: file.metadata?.reviewedAt,
      notes: file.metadata?.notes,
    }));

    client.close();

    return NextResponse.json({ success: true, resumes });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}
