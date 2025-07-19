import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Get the current session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);

    const sessionEmail = session.user.email;
    console.log("=== COMPANY STATUS CHECK ===");
    console.log("Session email:", sessionEmail);
    console.log("Session user ID:", (session as any).user?.id);

    // Check if user exists and has a company
    let user = await db.collection("users").findOne({
      email: sessionEmail,
    });

    console.log("Found user by email:", user ? "YES" : "NO");
    if (user) {
      console.log("User details:", {
        id: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
      });
    }

    if (!user) {
      console.log("No user found, creating new user record")
      
      // User might have a NextAuth session but no user record in our system
      // This can happen if the user record was manually deleted
      // Let's create a basic user record for them
      const newUser = {
        email: sessionEmail,
        name: session.user.name || sessionEmail.split('@')[0],
        image: session.user.image || null,
        role: 'employee', // Default role - will need to be updated during onboarding
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      try {
        const insertResult = await db.collection('users').insertOne(newUser)
        console.log("Created new user record:", insertResult.insertedId)
        
        return NextResponse.json({
          hasCompany: false,
          hasRole: false,
          needsOnboarding: true,
          needsRoleSelection: true,
          debug: {
            searchedEmail: sessionEmail,
            foundUser: false,
            createdNewUser: true
          }
        })
      } catch (createError) {
        console.error("Error creating user record:", createError)
        
        return NextResponse.json({
          hasCompany: false,
          hasRole: false,
          needsOnboarding: true,
          needsRoleSelection: true,
          debug: {
            searchedEmail: sessionEmail,
            foundUser: false,
            createUserFailed: true
          }
        })
      }
    }

    // Check if user has selected a role (anything other than default 'employee')
    const hasRole = user.role && user.role !== 'employee'
    
    // Check if user has a companyId
    const hasCompany = !!user.companyId;
    console.log("Final result - hasCompany:", hasCompany, "hasRole:", hasRole, "userRole:", user.role);

    return NextResponse.json({
      hasCompany,
      hasRole,
      companyId: user.companyId || null,
      role: user.role || "employee",
      needsOnboarding: !hasCompany,
      needsRoleSelection: !hasRole && !hasCompany,
      debug: {
        searchedEmail: sessionEmail,
        foundUser: true,
        userHasCompanyId: hasCompany,
        userCompanyId: user.companyId,
        userRole: user.role,
        hasRoleCalculation: `${user.role} && ${user.role} !== 'employee' = ${hasRole}`
      },
    });
  } catch (error) {
    console.error("Error checking user company status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Ensure client is closed
    if (client) {
      await client.close();
    }
  }
}
