import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import { hasHRAccess } from "@/lib/utils/roleCheck";

export async function PUT(request: NextRequest) {
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

    const { resumeId, status, notes } = await request.json();

    if (!resumeId || !status) {
      return NextResponse.json(
        { error: "Resume ID and status are required" },
        { status: 400 }
      );
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Update the file metadata
    await db.collection("resumes.files").updateOne(
      { _id: new ObjectId(resumeId) },
      {
        $set: {
          "metadata.status": status,
          "metadata.notes": notes || "",
          "metadata.reviewedBy": user.name || user.email,
          "metadata.reviewedAt": new Date(),
        },
      }
    );

    client.close();

    return NextResponse.json({
      success: true,
      message: "Resume status updated",
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    return NextResponse.json(
      { error: "Failed to update resume" },
      { status: 500 }
    );
  }
}
