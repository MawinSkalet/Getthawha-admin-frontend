// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  let isAuth = false;
  const token = req.cookies.get("admin")?.value;
  const pathname = req.nextUrl.pathname;

  // Skip auth check if no token
  if (!token) {
    // Continue with isAuth = false
  } else {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      if (payload && payload.id) {
        isAuth = true;
      }
    } catch {
      // If auth API fails, assume not authenticated for security
      isAuth = false;
    }
  }

  const protectedRoutes = [
    "/",
    "/bookingCalendar",
    "/manualBooking",
    "/userList",
    "/branchManagement",
    "/packageManagement",
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isAuth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  //if already login cant access login page
  if (pathname === "/login" && isAuth) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/bookingCalendar/:path*",
    "/manualBooking/:path*",
    "/login",
    "/userList/:path*",
    "/branchManagement/:path*",
    "/packageManagement/:path*",
  ],
};
