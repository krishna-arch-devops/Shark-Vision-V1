"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, StudentRegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@/lib/validation/auth";
import { getDashboardPathForRole } from "@/lib/auth/session";
import { UserRole } from "@/types/database";

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
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Invalid credentials. Please try again.",
    };
  }

  if (!data.user) {
    return {
      success: false,
      message: "User session could not be established.",
    };
  }

  // Fetch user role for redirection
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as UserRole) || "STUDENT";
  const redirectPath = getDashboardPathForRole(role);

  revalidatePath("/", "layout");
  redirect(redirectPath);
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
      message: "Please correct the errors in the form.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password, fullName, phoneNumber, targetExam } = validated.data;
  const supabase = await createClient();

  // Public registration creates STUDENT accounts only.
  // The database trigger will enforce role = 'STUDENT'.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber || null,
        target_exam: targetExam,
        // Notice: No privileged role is ever accepted from client payload
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to create account. Please try again.",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/student");
  }

  return {
    success: true,
    message: "Registration successful! Please check your email to verify your account before logging in.",
  };
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
      message: "Please enter a valid email address.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email } = validated.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Unable to send password reset link.",
    };
  }

  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been dispatched.",
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
      message: "Invalid password format.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { password } = validated.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Could not update password. Link may have expired.",
    };
  }

  return {
    success: true,
    message: "Password updated successfully. You can now login with your new password.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
