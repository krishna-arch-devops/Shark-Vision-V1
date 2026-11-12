import { getSession } from "@/lib/auth/local-auth";
import { Profile, UserRole } from "@/types/database";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return { id: session.userId, email: session.email };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  const [userProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);

  if (!userProfile) return null;

  return {
    id: userProfile.id,
    email: userProfile.email,
    role: userProfile.role as UserRole,
    full_name: userProfile.fullName,
    phone_number: userProfile.phoneNumber,
    avatar_url: userProfile.avatarUrl,
    is_active: userProfile.isActive,
    created_at: userProfile.createdAt.toISOString(),
    updated_at: userProfile.updatedAt.toISOString(),
  };
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

export { getDashboardPathForRole } from "@/lib/auth/roles";
