import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { MongoClient } from 'mongodb'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { role } = await request.json()
    
    if (!role || !["hr", "employee"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'hr' or 'employee'" },
        { status: 400 }
      )
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB_NAME)
    
    // Update user role in database
    const userRole = role === "hr" ? "hr_manager" : "employee"
    
    const updateResult = await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $set: {
          role: userRole,
          updatedAt: new Date()
        }
      }
    )

    await client.close()

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      role: userRole,
      message: "User role updated successfully"
    })

  } catch (error) {
    console.error("Error setting user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
