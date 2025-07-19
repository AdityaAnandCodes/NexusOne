import { NextRequest, NextResponse } from "next/server";
import { connectToMainDB } from "@/lib/mongodb";
import { Company } from "@/lib/models/main";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ companies: [] });
    }

    await connectToMainDB();

    // Search companies by name or domain (case-insensitive)
    const companies = await Company.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { domain: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .select("name domain logo contactEmail")
      .limit(10)
      .sort({ name: 1 });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error searching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
