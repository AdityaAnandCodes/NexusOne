import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeOnboarding } from "@/lib/models/main";
import { MongoClient } from "mongodb";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "File and document type are required" },
        { status: 400 }
      );
    }

    // Get user details
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user || !user.companyId) {
      await client.close();
      return NextResponse.json(
        { error: "User not associated with a company" },
        { status: 403 }
      );
    }

    await client.close();

    // Connect to main DB
    await connectToMainDB();

    // Get employee onboarding record
    const onboarding = await EmployeeOnboarding.findOne({
      employeeId: user._id,
      companyId: user.companyId,
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Onboarding record not found" },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "onboarding"
    );
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const fileName = `${user._id}_${documentType}_${timestamp}_${file.name}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Update onboarding record
    const existingDocIndex = onboarding.documents.findIndex(
      (doc: any) => doc.type === documentType
    );

    const documentRecord = {
      type: documentType,
      fileName: file.name,
      filePath: `/uploads/onboarding/${fileName}`,
      uploadedAt: new Date(),
      status: "pending_review",
    };

    if (existingDocIndex >= 0) {
      onboarding.documents[existingDocIndex] = documentRecord;
    } else {
      onboarding.documents.push(documentRecord);
    }

    await onboarding.save();

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: documentRecord,
      onboardingStatus: {
        totalTasks: onboarding.tasks.length,
        completedTasks: onboarding.tasks.filter(
          (t: any) => t.status === "completed"
        ).length,
        totalPolicies: onboarding.policies.length,
        acknowledgedPolicies: onboarding.policies.filter(
          (p: any) => p.acknowledged
        ).length,
        totalDocuments: onboarding.documents.length,
        approvedDocuments: onboarding.documents.filter(
          (d: any) => d.status === "approved"
        ).length,
        isComplete: onboarding.status === "completed",
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
