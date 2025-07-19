import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware without NextAuth for now to avoid Edge Runtime crypto issues
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/callback",
    "/auth/error",
    "/terms",
    "/privacy",
  ];

  // For now, allow all routes to work without authentication middleware
  // We'll implement client-side auth checks in components
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
