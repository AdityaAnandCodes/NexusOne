import { auth } from "@/lib/auth";
import { User, EmployeeOnboarding } from "@/lib/models/main";
import { connectToMainDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { hasHRAccess } from "@/lib/utils/roleCheck";

export async function GET(request: NextRequest) {
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

    console.log(
      "🔍 Fetching all onboarding records for company:",
      user.companyId
    );

    // Get all employees in the company
    const employees = await User.find({
      companyId: user.companyId,
      role: "employee",
    }).select("name email department position");

    console.log(
      "👥 Found employees:",
      employees.map((e) => ({ name: e.name, email: e.email }))
    );

    // Get all onboarding records with documents
    const onboardingRecords = await EmployeeOnboarding.find({
      companyId: user.companyId,
    });

    console.log("📋 Found onboarding records:", onboardingRecords.length);

    // Log each record for debugging
    onboardingRecords.forEach((record, index) => {
      interface DocumentInfo {
        id: string;
        name: string;
        status: string;
      }

      interface RecordLog {
        employeeId: string;
        status: string;
        documentsCount: number;
        documents: DocumentInfo[];
      }

      const logData: RecordLog = {
        employeeId: record.employeeId as string,
        status: record.status as string,
        documentsCount: (record.documents?.length || 0) as number,
        documents:
          record.documents?.map(
            (doc: {
              id: string;
              name: string;
              status: string;
            }): DocumentInfo => ({
              id: doc.id,
              name: doc.name,
              status: doc.status,
            })
          ) || [],
      };

      console.log(`📄 Record ${index + 1}:`, logData);
    });

    // Flatten documents with employee info
    const allDocuments = [];

    for (const record of onboardingRecords) {
      const employee = employees.find((emp) => emp.email === record.employeeId);

      if (record.documents && record.documents.length > 0) {
        for (const document of record.documents) {
          console.log("🔍 Processing document:", {
            documentId: document.id || document._id,
            documentName: document.name,
            employeeEmail: record.employeeId,
            employeeName: employee?.name,
          });

          allDocuments.push({
            id: document.id || document._id?.toString(), // Handle both id and _id
            name: document.name,
            type: document.type,
            size: document.size,
            uploadedAt: document.uploadedAt,
            status: document.verified
              ? "verified"
              : document.status || "pending",
            url: document.url,
            employee: {
              name: employee?.name || "Unknown Employee",
              email: employee?.email || record.employeeId,
              department: employee?.department,
              position: employee?.position,
            },
            verifiedBy: document.verifiedBy,
            verifiedAt: document.verifiedAt,
            rejectionReason: document.rejectionReason,
          });
        }
      }
    }

    console.log("📊 Total documents found:", allDocuments.length);
    console.log(
      "📝 All document IDs:",
      allDocuments.map((doc) => doc.id)
    );

    // Sort by upload date (newest first)
    allDocuments.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      documents: allDocuments,
      debug: {
        totalEmployees: employees.length,
        totalOnboardingRecords: onboardingRecords.length,
        totalDocuments: allDocuments.length,
        documentIds: allDocuments.map((doc) => doc.id),
      },
    });
  } catch (error) {
    console.error("Error fetching HR documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
