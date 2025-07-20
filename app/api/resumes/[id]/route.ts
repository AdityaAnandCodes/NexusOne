import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import { hasHRAccess } from "@/lib/utils/roleCheck";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const downloadStream = bucket.openDownloadStream(new ObjectId(params.id));
    const chunks: Buffer[] = [];

    return new Promise<NextResponse>((resolve) => {
      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("end", async () => {
        const buffer = Buffer.concat(chunks);

        // Get file info for headers
        const fileInfo = await db
          .collection("resumes.files")
          .findOne({ _id: new ObjectId(params.id) });

        client.close();

        const response = new NextResponse(buffer);
        response.headers.set(
          "Content-Type",
          fileInfo?.metadata?.contentType || "application/pdf"
        );
        response.headers.set(
          "Content-Disposition",
          `attachment; filename="${fileInfo?.filename}"`
        );

        resolve(response);
      });

      downloadStream.on("error", () => {
        client.close();
        resolve(
          NextResponse.json({ error: "File not found" }, { status: 404 })
        );
      });
    });
  } catch (error) {
    console.error("Error downloading resume:", error);
    return NextResponse.json(
      { error: "Failed to download resume" },
      { status: 500 }
    );
  }
}
