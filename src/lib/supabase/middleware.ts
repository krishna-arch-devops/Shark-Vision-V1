import { NextResponse, type NextRequest } from "next/server";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { UserRole } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get("sv_session_token")?.value;

  let sessionUser: { userId: string; email: string; role: UserRole } | null = null;

  if (token) {
    try {
      // Decode JWT payload safely in edge/middleware
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        sessionUser = JSON.parse(payloadJson);
      }
    } catch {
      sessionUser = null;
    }
  }

  const pathname = request.nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isDashboardRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/student");

  // 1. If unauthenticated user tries to access protected dashboard routes, redirect to login
  if (!sessionUser && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If authenticated user accesses auth routes (login/register), redirect to their dashboard
  if (sessionUser && isAuthRoute) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDashboardPathForRole(sessionUser.role);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Role-based route enforcement
  if (sessionUser && isDashboardRoute) {
    const userRole = sessionUser.role;

    if (pathname.startsWith("/admin") && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/teacher") && userRole !== "TEACHER" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/parent") && userRole !== "PARENT" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/student") && userRole !== "STUDENT" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
