import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToMainDB } from "@/lib/mongodb";
import { Company } from "@/lib/models/main";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

// Get company settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details to verify company access
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

    // Check if user has admin/HR role
    if (!["hr_manager", "company_admin"].includes(user.role)) {
      await client.close();
      return NextResponse.json(
        {
          error: "Unauthorized. Only HR managers can access company settings.",
        },
        { status: 403 }
      );
    }

    await client.close();

    // Connect to main DB to get company details
    await connectToMainDB();

    const company = await Company.findById(user.companyId);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      company: company.toObject(),
    });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update company settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details to verify company access
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

    // Check if user has admin/HR role
    if (!["hr_manager", "company_admin"].includes(user.role)) {
      await client.close();
      return NextResponse.json(
        {
          error: "Unauthorized. Only HR managers can update company settings.",
        },
        { status: 403 }
      );
    }

    await client.close();

    // Get the update data
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.name || !updateData.contactEmail || !updateData.domain) {
      return NextResponse.json(
        { error: "Company name, domain, and contact email are required" },
        { status: 400 }
      );
    }

    // Connect to main DB to update company
    await connectToMainDB();

    // In the PUT method, update this section:
    const updatedCompany = await Company.findByIdAndUpdate(
      user.companyId,
      {
        $set: {
          name: updateData.name,
          domain: updateData.domain,
          description: updateData.description,
          website: updateData.website,
          contactEmail: updateData.contactEmail,
          contactPhone: updateData.contactPhone,
          address: updateData.address,
          onboarding: {
            ...updateData.onboarding,
            policies: {
              ...updateData.onboarding.policies,
              // Preserve fileIds when updating
              handookFileId: updateData.onboarding.policies.handookFileId,
              codeOfConductFileId:
                updateData.onboarding.policies.codeOfConductFileId,
              // ... add other fileId fields
            },
          },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Company settings updated successfully",
      company: updatedCompany.toObject(),
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
