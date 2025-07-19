import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeOnboarding } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

// Get all employee onboarding records for HR review
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user || !user.companyId || user.role !== "hr") {
      await client.close();
      return NextResponse.json(
        { error: "Unauthorized - HR access required" },
        { status: 403 }
      );
    }

    await client.close();

    // Connect to main DB
    await connectToMainDB();

    // Get all onboarding records for the company
    const onboardingRecords = await EmployeeOnboarding.find({
      companyId: user.companyId,
    }).lean();

    // Get employee details for each record
    const client2 = new MongoClient(process.env.MONGODB_URI!);
    await client2.connect();
    const db2 = client2.db(process.env.MONGODB_DB_NAME);

    const enrichedRecords = await Promise.all(
      onboardingRecords.map(async (record) => {
        const employee = await db2.collection("users").findOne({
          _id: record.employeeId,
        });

        return {
          ...record,
          employeeName: employee?.name || "Unknown",
          employeeEmail: employee?.email || "Unknown",
          tasksProgress: {
            total: record.tasks.length,
            completed: record.tasks.filter((t: any) => t.status === "completed")
              .length,
          },
          policiesProgress: {
            total: record.policies.length,
            acknowledged: record.policies.filter((p: any) => p.acknowledged)
              .length,
          },
          documentsProgress: {
            total: record.documents.length,
            approved: record.documents.filter(
              (d: any) => d.status === "approved"
            ).length,
            pending: record.documents.filter(
              (d: any) => d.status === "pending_review"
            ).length,
          },
        };
      })
    );

    await client2.close();

    return NextResponse.json({
      success: true,
      onboardingRecords: enrichedRecords,
    });
  } catch (error) {
    console.error("Error fetching onboarding records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Approve/reject documents or provide feedback
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, employeeId, documentType, feedback } = await request.json();

    if (
      !action ||
      !employeeId ||
      (action !== "provide_feedback" && !documentType)
    ) {
      return NextResponse.json(
        { error: "Invalid action or missing required parameters" },
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

    if (!user || !user.companyId || user.role !== "hr") {
      await client.close();
      return NextResponse.json(
        { error: "Unauthorized - HR access required" },
        { status: 403 }
      );
    }

    await client.close();

    // Connect to main DB
    await connectToMainDB();

    // Get employee onboarding record
    const onboarding = await EmployeeOnboarding.findOne({
      employeeId: employeeId,
      companyId: user.companyId,
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Onboarding record not found" },
        { status: 404 }
      );
    }

    let updated = false;
    let message = "";

    if (action === "approve_document") {
      const document = onboarding.documents.find(
        (d: any) => d.type === documentType
      );
      if (document) {
        document.status = "approved";
        document.reviewedAt = new Date();
        document.reviewedBy = user._id;
        updated = true;
        message = "Document approved successfully";
      }
    } else if (action === "reject_document") {
      const document = onboarding.documents.find(
        (d: any) => d.type === documentType
      );
      if (document) {
        document.status = "rejected";
        document.reviewedAt = new Date();
        document.reviewedBy = user._id;
        document.feedback = feedback || "Document rejected";
        updated = true;
        message = "Document rejected";
      }
    } else if (action === "provide_feedback") {
      onboarding.feedback = feedback;
      updated = true;
      message = "Feedback provided successfully";
    }

    if (updated) {
      await onboarding.save();
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error updating onboarding record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
