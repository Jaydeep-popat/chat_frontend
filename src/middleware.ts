import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/chat-page", "/profile", "/updateAccount", "/change-password"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${API_BASE_URL}/api/users/getCurrentUser`;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // For Authorization header approach, we can't access localStorage in middleware
    // So we'll let the frontend AuthContext handle authentication
    // and only do basic routing protection here
    
    // Allow the request to proceed and let the frontend handle auth validation
    // The AuthContext will redirect to login if tokens are missing/invalid
    return NextResponse.next();
  }

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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Explicitly include protected routes
    '/chat-page/:path*',
    '/profile/:path*',
    '/updateAccount/:path*',
    '/change-password/:path*'
  ],
};
