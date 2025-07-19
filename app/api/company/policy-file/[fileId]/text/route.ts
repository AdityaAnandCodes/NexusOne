import { NextRequest, NextResponse } from "next/server";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const bucket = new GridFSBucket(db, { bucketName: "policies" });

    const fileId = new ObjectId(resolvedParams.fileId);
    const downloadStream = bucket.openDownloadStream(fileId);

    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString("utf8");

        client.close();
        resolve(NextResponse.json({ text }));
      });
      downloadStream.on("error", () => {
        client.close();
        resolve(
          NextResponse.json({ error: "Error retrieving text" }, { status: 500 })
        );
      });
    });
  } catch (error) {
    console.error("Error retrieving text:", error);
    return NextResponse.json(
      { error: "Text retrieval failed" },
      { status: 500 }
    );
  }
}
