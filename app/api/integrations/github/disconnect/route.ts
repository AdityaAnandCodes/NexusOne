import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

interface LogoutSuccessResponse {
  success: boolean;
}

interface LogoutErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const response = NextResponse.json<LogoutSuccessResponse>({
      success: true,
    });
    response.cookies.delete("github_user");
    return response;
  } catch (error) {
    console.error("Error disconnecting GitHub:", error);
    return NextResponse.json<LogoutErrorResponse>(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
