import { auth } from "@/lib/auth";
import { User, EmployeeOnboarding } from "@/lib/models/main";
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only employees can access their own documents
    if (user.role !== "employee") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const onboarding = await EmployeeOnboarding.findOne({
      employeeId: user.email,
      companyId: user.companyId,
    });

    return NextResponse.json({
      success: true,
      documents: onboarding?.documents || [],
    });
  } catch (error) {
    console.error("Error fetching employee documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
