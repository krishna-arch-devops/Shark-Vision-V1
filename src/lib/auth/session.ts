import { createClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as Profile;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!allowedRoles.includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    case "STUDENT":
      return "/student";
    default:
      return "/student";
  }
}
