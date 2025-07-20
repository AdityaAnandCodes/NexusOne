import { auth } from "@/lib/auth";
import {
  User,
  EmployeeOnboarding,
  EmployeeInvitation,
} from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

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

    const companyId = user.companyId;

    // Create onboarding records for accepted users who don't have them
    const acceptedInvitationsData = await EmployeeInvitation.find({
      companyId: companyId,
      status: "accepted",
    });

    let createdOnboardingCount = 0;
    for (const invitation of acceptedInvitationsData) {
      const existingOnboarding = await EmployeeOnboarding.findOne({
        companyId: companyId,
        employeeId: invitation.email,
      });

      if (!existingOnboarding) {
        // Create onboarding record for this accepted invitation
        await EmployeeOnboarding.create({
          employeeId: invitation.email,
          companyId: companyId,
          status: "in_progress", // Changed from "not_started" to "in_progress"
          startedAt: new Date(), // Add start date
          tasks: [],
          policies: [],
          documents: [],
          chatSessions: [],
        });
        createdOnboardingCount++;
      }
    }

    // Updated count queries for simplified onboarding
    const [
      totalEmployees,
      activeOnboarding,
      completedOnboarding,
      pendingDocuments,
      pendingInvitations,
    ] = await Promise.all([
      // Count ALL users in the company
      User.countDocuments({
        companyId: companyId,
      }),

      // Active onboarding - employees who haven't completed onboarding yet
      // This includes: no documents uploaded OR documents pending approval
      EmployeeOnboarding.countDocuments({
        companyId: companyId,
        $or: [
          { status: { $in: ["not_started", "in_progress"] } },
          {
            status: { $ne: "completed" },
            $or: [
              { "documents.0": { $exists: false } }, // No documents uploaded
              {
                $and: [
                  { "documents.0": { $exists: true } }, // Has documents
                  { "documents.status": { $ne: "verified" } }, // But none verified
                ],
              },
            ],
          },
        ],
      }),

      // Completed onboarding - employees with at least one approved document
      EmployeeOnboarding.countDocuments({
        companyId: companyId,
        status: "completed",
      }),

      // Count documents awaiting approval (pending tasks)
      EmployeeOnboarding.aggregate([
        { $match: { companyId: companyId } },
        { $unwind: { path: "$documents", preserveNullAndEmptyArrays: false } },
        { $match: { "documents.status": "pending" } },
        { $count: "total" },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),

      // Count pending invitations
      EmployeeInvitation.countDocuments({
        companyId: companyId,
        status: "pending",
      }),
    ]);

    const stats = {
      totalEmployees,
      activeOnboarding,
      completedOnboarding,
      pendingTasks: pendingDocuments + pendingInvitations, // Combined pending items
    };

    console.log("Final stats:", stats);

    return NextResponse.json({
      success: true,
      stats,
      debug: {
        companyId,
        createdOnboardingCount,
        rawCounts: {
          totalEmployees,
          activeOnboarding,
          completedOnboarding,
          pendingDocuments,
          pendingInvitations,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
