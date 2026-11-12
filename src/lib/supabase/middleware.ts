import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { UserRole } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If authenticated user accesses auth routes (login/register), redirect to their dashboard
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role as UserRole) || "STUDENT";
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDashboardPathForRole(role);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Role-based route enforcement
  if (user && isDashboardRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = (profile?.role as UserRole) || "STUDENT";

    // Super admin can access admin dashboard
    if (pathname.startsWith("/admin") && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    // Teacher can access teacher dashboard
    if (pathname.startsWith("/teacher") && userRole !== "TEACHER" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    // Parent can access parent dashboard
    if (pathname.startsWith("/parent") && userRole !== "PARENT" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }

    // Student can access student dashboard
    if (pathname.startsWith("/student") && userRole !== "STUDENT" && userRole !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPathForRole(userRole);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
