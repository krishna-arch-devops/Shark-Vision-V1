import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UserRole } from "@/types/database";

const JWT_SECRET = process.env.APP_SECRET || "sharkvision_default_local_jwt_secret_dev_32_bytes_min";
const SESSION_COOKIE_NAME = "sv_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function authenticateLocalUser(email: string, pass: string): Promise<SessionPayload | null> {
  const userList = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email.toLowerCase().trim()))
    .limit(1);

  if (userList.length === 0) return null;
  const user = userList[0];

  if (!user.passwordHash) return null;
  const isValid = await verifyPassword(pass, user.passwordHash);
  if (!isValid) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    fullName: user.fullName,
  };
}
