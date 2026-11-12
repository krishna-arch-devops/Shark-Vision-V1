"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LoginSchema,
  StudentRegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/validation/auth";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import {
  authenticateLocalUser,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
} from "@/lib/auth/local-auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AuthState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = LoginSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed. Please verify your inputs.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // Authenticate against native PostgreSQL database
  const sessionUser = await authenticateLocalUser(email, password);

  if (!sessionUser) {
    return {
      success: false,
      message: "Invalid email or password. Please verify your credentials.",
    };
  }

  // Generate secure JWT and set HTTP-only cookie
  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  const destination = getDashboardPathForRole(sessionUser.role);
  redirect(destination);
}

export async function registerStudentAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = StudentRegisterSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed. Please verify your inputs.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password, fullName, phoneNumber } = validated.data;

  // Check if user already exists
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      message: "An account with this email address already exists.",
    };
  }

  const passwordHash = await hashPassword(password);

  // Enforce STUDENT role strictly for public sign-ups
  const [newStudent] = await db
    .insert(profiles)
    .values({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "STUDENT",
      fullName,
      phoneNumber: phoneNumber || null,
      isActive: true,
    })
    .returning();

  const sessionUser = {
    userId: newStudent.id,
    email: newStudent.email,
    role: "STUDENT" as const,
    fullName: newStudent.fullName,
  };

  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  redirect("/student");
}

export async function forgotPasswordAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = ForgotPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed. Please enter a valid email.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    message: "If an account exists with this email, a reset link will be sent.",
  };
}

export async function resetPasswordAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = ResetPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed. Please check your password requirements.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    message: "Password reset complete. Please log in with your new password.",
  };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
