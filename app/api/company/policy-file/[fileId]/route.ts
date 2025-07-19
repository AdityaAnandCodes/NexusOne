import { NextRequest, NextResponse } from "next/server";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Await the params before using
    const resolvedParams = await params;

    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    const fileId = new ObjectId(resolvedParams.fileId);
    const downloadStream = bucket.openDownloadStream(fileId);

    // Get file info for headers
    const fileInfo = await bucket.find({ _id: fileId }).toArray();
    if (fileInfo.length === 0) {
      await client.close();
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileInfo[0];

    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const response = new NextResponse(buffer);

        // Set content type based on stored metadata
        const contentType = file.metadata?.contentType || "text/plain";
        response.headers.set("Content-Type", contentType);

        // For text files, set as inline for viewing
        const disposition =
          contentType === "text/plain" ? "inline" : "attachment";
        response.headers.set(
          "Content-Disposition",
          `${disposition}; filename="${file.filename}"`
        );

        client.close();
        resolve(response);
      });
      downloadStream.on("error", () => {
        client.close();
        resolve(
          NextResponse.json({ error: "Error retrieving file" }, { status: 500 })
        );
      });
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { error: "File retrieval failed" },
      { status: 500 }
    );
  }
}
