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
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Use fetch with correct method
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          'Cookie': `accessToken=${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (data && data.success) {
        return NextResponse.next();
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      // Token verification failed
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
