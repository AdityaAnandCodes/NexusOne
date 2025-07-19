import { NextRequest, NextResponse } from "next/server";
import { connectToMainDB } from "@/lib/mongodb";
import { Company, User } from "@/lib/models/main";
import { v4 as uuidv4 } from "uuid";
import { MongoClient } from "mongodb";
import { auth } from "@/lib/auth";

// Force Node.js runtime for database operations
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get the current session to find the authenticated user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);

    const { name, domain, contactEmail, contactPhone, address } = body;
    const userEmail = session.user.email; // Use session email instead of body userEmail

    // Validate required fields
    if (!name || !domain || !contactEmail) {
      console.log("Missing required fields:", { name, domain, contactEmail });
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, domain, and contactEmail are required",
        },
        { status: 400 }
      );
    }

    // Connect to main database
    await connectToMainDB();

    // Check if domain already exists
    const existingCompany = await Company.findOne({ domain });
    if (existingCompany) {
      return NextResponse.json(
        { error: "Company domain already exists" },
        { status: 409 }
      );
    }

    // Connect to MongoDB to work with NextAuth user collection
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    // Find the current NextAuth user by session user ID or email
    let user = null;

    console.log("Looking for user with session:", {
      sessionEmail: userEmail,
      sessionUserId: (session as any).user?.id,
    });

    if ((session as any).user?.id) {
      user = await db.collection("users").findOne({
        _id: new (require("mongodb").ObjectId)((session as any).user.id),
      });
      console.log("Found user by ID:", user ? "Yes" : "No");
    }

    if (!user) {
      // Fallback to email lookup
      user = await db.collection("users").findOne({ email: userEmail });
      console.log("Found user by email:", user ? "Yes" : "No");
    }

    if (!user) {
      await client.close();
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 404 }
      );
    }

    console.log("User found:", {
      userId: user._id,
      email: user.email,
      currentCompanyId: user.companyId,
    });

    // Create company
    const company = new Company({
      name,
      domain,
      contactEmail,
      contactPhone,
      address,
      isActive: true,
      subscription: {
        plan: "free",
        status: "active",
      },
      settings: {
        allowSelfRegistration: false,
        requireEmailVerification: true,
      },
    });

    const savedCompany = await company.save();
    const actualCompanyId = savedCompany._id.toString();

    console.log("Company created with ID:", actualCompanyId);

    // Update the NextAuth user with company ID and admin role
    const updateResult = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          companyId: actualCompanyId,
          role: "company_admin",
          updatedAt: new Date(),
        },
      }
    );

    console.log("User update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged,
    });

    // Verify the update worked
    const updatedUser = await db.collection("users").findOne({ _id: user._id });
    console.log("Updated user:", {
      userId: updatedUser?._id,
      email: updatedUser?.email,
      companyId: updatedUser?.companyId,
      role: updatedUser?.role,
    });

    await client.close();

    return NextResponse.json({
      success: true,
      companyId: actualCompanyId,
      message: "Company created successfully",
      refresh: true, // Signal frontend to refresh session
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToMainDB();

    // Get all companies (simplified for now)
    const companies = await Company.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
