import { auth } from "@/lib/auth";
import { User } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get session and user info
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to main DB to get user's companyId
    await connectToMainDB();
    const user = await User.findOne({ email: session.user?.email });

    if (!user || !user.companyId) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid file ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB for GridFS
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    try {
      // Check if file exists and belongs to the user's company
      const fileInfo = await bucket
        .find({
          _id: new ObjectId(id),
          "metadata.companyId": user.companyId.toString(),
        })
        .next();

      if (!fileInfo) {
        client.close();
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }

      // Create download stream
      const downloadStream = bucket.openDownloadStream(new ObjectId(id));

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];

      return new Promise<NextResponse>((resolve, reject) => {
        downloadStream.on("data", (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          client.close();

          // Determine content type
          const contentType =
            fileInfo.metadata?.contentType || "application/octet-stream";

          // Create response with appropriate headers
          const response = new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Length": buffer.length.toString(),
              "Content-Disposition": `inline; filename="${fileInfo.filename}"`,
              "Cache-Control": "public, max-age=31536000", // Cache for 1 year
            },
          });

          resolve(response);
        });

        downloadStream.on("error", (error) => {
          console.error("GridFS download error:", error);
          client.close();
          resolve(
            NextResponse.json(
              { error: "Failed to download file" },
              { status: 500 }
            )
          );
        });
      });
    } catch (gridfsError) {
      console.error("GridFS error:", gridfsError);
      client.close();
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Policy download error:", error);
    return NextResponse.json(
      { error: "Failed to download policy" },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE method to remove files
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid file ID format" },
        { status: 400 }
      );
    }

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    try {
      // Check if file exists and belongs to the user's company
      const fileInfo = await bucket
        .find({
          _id: new ObjectId(id),
          "metadata.companyId": user.companyId.toString(),
        })
        .next();

      if (!fileInfo) {
        client.close();
        return NextResponse.json(
          { error: "File not found or access denied" },
          { status: 404 }
        );
      }

      // If this is an original PDF, also delete its associated text file
      if (fileInfo.metadata?.fileType === "original") {
        // Find and delete associated text file
        const textFile = await bucket
          .find({
            "metadata.originalFileId": id,
            "metadata.companyId": user.companyId.toString(),
          })
          .next();

        if (textFile) {
          await bucket.delete(textFile._id);
          console.log(`Deleted associated text file: ${textFile._id}`);
        }
      }

      // Delete the main file
      await bucket.delete(new ObjectId(id));
      client.close();

      return NextResponse.json({
        message: "File deleted successfully",
        deletedId: id,
      });
    } catch (gridfsError) {
      console.error("GridFS delete error:", gridfsError);
      client.close();
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Policy delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
