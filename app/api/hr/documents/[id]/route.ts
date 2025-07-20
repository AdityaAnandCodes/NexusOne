import { auth } from "@/lib/auth";
import { User, EmployeeOnboarding } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { hasHRAccess } from "@/lib/utils/roleCheck";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🚀 Starting document approval process");

    const { id } = await params;
    console.log("📝 Document ID:", id);

    const body = await request.json();
    const { action, rejectionReason } = body;
    console.log("🎯 Action:", action, "Reason:", rejectionReason);

    const session = await auth();
    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToMainDB();
    const user = await User.findOne({ email: session.user?.email });
    console.log("👤 User found:", user?.email, "Role:", user?.role);

    if (!user || !hasHRAccess(user.role)) {
      console.log("❌ Access denied for user role:", user?.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("🔍 Searching for document with different methods...");

    // Method 1: Search by documents.id
    let employeeRecord = await EmployeeOnboarding.findOne({
      companyId: user.companyId,
      "documents.id": id,
    });

    // Method 2: Search by documents._id if Method 1 fails
    if (!employeeRecord) {
      console.log("🔍 Method 1 failed, trying documents._id...");
      employeeRecord = await EmployeeOnboarding.findOne({
        companyId: user.companyId,
        "documents._id": id,
      });
    }

    // Method 3: Search through all records manually
    if (!employeeRecord) {
      console.log("🔍 Method 2 failed, searching manually...");
      const allRecords = await EmployeeOnboarding.find({
        companyId: user.companyId,
        "documents.0": { $exists: true },
      });

      console.log("📋 Found", allRecords.length, "records with documents");

      for (const record of allRecords) {
        console.log(`📄 Checking record for ${record.employeeId}:`);
        if (record.documents) {
          for (const doc of record.documents) {
            console.log("  🔍 Document:", {
              id: doc.id,
              _id: doc._id?.toString(),
              name: doc.name,
            });

            if (doc.id === id || doc._id?.toString() === id) {
              console.log("  ✅ Found matching document!");
              employeeRecord = record;
              break;
            }
          }
        }
        if (employeeRecord) break;
      }
    }

    if (!employeeRecord) {
      console.log("❌ No employee record found with document ID:", id);

      // Debug: List all available document IDs
      const allRecords = await EmployeeOnboarding.find({
        companyId: user.companyId,
        "documents.0": { $exists: true },
      });

      const allDocIds = [];
      for (const record of allRecords) {
        if (record.documents) {
          for (const doc of record.documents) {
            allDocIds.push({
              id: doc.id,
              _id: doc._id?.toString(),
              name: doc.name,
              employee: record.employeeId,
            });
          }
        }
      }

      console.log("📊 Available document IDs:", allDocIds);

      return NextResponse.json(
        {
          error: "Document not found",
          debug: {
            searchedId: id,
            availableDocuments: allDocIds,
          },
        },
        { status: 404 }
      );
    }

    console.log("✅ Found employee record:", employeeRecord.employeeId);

    // Find the specific document in the array
    const documentIndex = employeeRecord.documents.findIndex(
      (doc: any) => doc.id === id || doc._id?.toString() === id
    );

    if (documentIndex === -1) {
      return NextResponse.json(
        { error: "Document not found in employee record" },
        { status: 404 }
      );
    }

    // Update the specific document using array index
    const updatePath = `documents.${documentIndex}`;
    const documentUpdateData: any = {
      [`${updatePath}.verified`]: action === "approve",
      [`${updatePath}.status`]: action === "approve" ? "verified" : "rejected",
      [`${updatePath}.verifiedBy`]: user.name,
      [`${updatePath}.verifiedAt`]: new Date(),
    };

    if (action === "reject" && rejectionReason) {
      documentUpdateData[`${updatePath}.rejectionReason`] = rejectionReason;
    }

    console.log("📝 Updating document with data:", documentUpdateData);

    // Update the document
    const documentResult = await EmployeeOnboarding.updateOne(
      {
        _id: employeeRecord._id,
      },
      {
        $set: documentUpdateData,
      }
    );

    console.log("📊 Document update result:", documentResult);

    // If approving, mark the entire onboarding as completed
    if (action === "approve") {
      console.log("✅ Approving document - marking onboarding as completed");

      const onboardingResult = await EmployeeOnboarding.updateOne(
        {
          _id: employeeRecord._id,
        },
        {
          $set: {
            status: "completed",
            completedAt: new Date(),
          },
        }
      );

      console.log("📊 Onboarding update result:", onboardingResult);
    }

    const successMessage =
      action === "approve"
        ? "Document approved and employee onboarded successfully! 🎉"
        : "Document rejected. Employee can upload a new document.";

    console.log("✅ Process completed successfully");

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("❌ Error updating document status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
