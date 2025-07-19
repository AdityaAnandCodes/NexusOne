import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { EmployeeOnboarding } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

// Update onboarding progress (complete tasks, acknowledge policies)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, taskId, policyName } = await request.json();

    if (
      !action ||
      (action === "complete_task" && !taskId) ||
      (action === "acknowledge_policy" && !policyName)
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

    let updated = false;

    if (action === "complete_task") {
      // Find and update task status
      const task = onboarding.tasks.find((t: any) => t.taskId === taskId);
      if (task) {
        task.status = "completed";
        task.completedAt = new Date();
        updated = true;
      }
    } else if (action === "acknowledge_policy") {
      // Find and update policy acknowledgment
      const policy = onboarding.policies.find(
        (p: any) => p.policyName === policyName
      );
      if (policy) {
        policy.acknowledged = true;
        policy.acknowledgedAt = new Date();
        updated = true;
      }
    }

    if (updated) {
      // Check if onboarding is complete
      const allRequiredTasksComplete = onboarding.tasks
        .filter((t: any) => t.required)
        .every((t: any) => t.status === "completed");

      const allRequiredPoliciesAcknowledged = onboarding.policies
        .filter((p: any) => p.required)
        .every((p: any) => p.acknowledged);

      if (
        allRequiredTasksComplete &&
        allRequiredPoliciesAcknowledged &&
        onboarding.status !== "completed"
      ) {
        onboarding.status = "completed";
        onboarding.completedAt = new Date();
      }

      await onboarding.save();
    }

    return NextResponse.json({
      success: true,
      message:
        action === "complete_task" ? "Task completed!" : "Policy acknowledged!",
      onboardingStatus: {
        totalTasks: onboarding.tasks.length,
        completedTasks: onboarding.tasks.filter(
          (t: any) => t.status === "completed"
        ).length,
        totalPolicies: onboarding.policies.length,
        acknowledgedPolicies: onboarding.policies.filter(
          (p: any) => p.acknowledged
        ).length,
        isComplete: onboarding.status === "completed",
      },
    });
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get onboarding progress
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
      return NextResponse.json({
        success: true,
        onboarding: null,
        message: "No onboarding record found",
      });
    }

    return NextResponse.json({
      success: true,
      onboarding: {
        status: onboarding.status,
        startedAt: onboarding.startedAt,
        completedAt: onboarding.completedAt,
        tasks: onboarding.tasks,
        policies: onboarding.policies,
        documents: onboarding.documents,
        satisfactionScore: onboarding.satisfactionScore,
        feedback: onboarding.feedback,
      },
      onboardingStatus: {
        totalTasks: onboarding.tasks.length,
        completedTasks: onboarding.tasks.filter(
          (t: any) => t.status === "completed"
        ).length,
        totalPolicies: onboarding.policies.length,
        acknowledgedPolicies: onboarding.policies.filter(
          (p: any) => p.acknowledged
        ).length,
        isComplete: onboarding.status === "completed",
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
