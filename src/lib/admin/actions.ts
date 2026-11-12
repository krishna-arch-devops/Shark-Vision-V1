"use server";

import { db } from "@/lib/db";
import {
  examinations,
  examinationAttempts,
  profiles,
  institutions,
  batches,
  subjects,
  questions,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

// 1. Update Examination Parameters (maxAttempts, durationMinutes, isPublished, etc.)
export async function updateExamSettingsAction(formData: FormData) {
  const profile = await requireRole(["SUPER_ADMIN", "TEACHER"]);
  const examId = formData.get("examId") as string;
  const maxAttempts = parseInt(formData.get("maxAttempts") as string, 10);
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
  const isPublished = formData.get("isPublished") === "true";
  const resultReleasePolicy = formData.get("resultReleasePolicy") as any;

  if (!examId || isNaN(maxAttempts) || maxAttempts < 1) {
    throw new Error("Invalid parameters provided.");
  }

  // Teacher can only update their own exams unless SUPER_ADMIN
  if (profile.role === "TEACHER") {
    const [existing] = await db
      .select({ createdBy: examinations.createdBy })
      .from(examinations)
      .where(eq(examinations.id, examId))
      .limit(1);

    if (!existing || existing.createdBy !== profile.id) {
      throw new Error("Unauthorized to modify this examination.");
    }
  }

  await db
    .update(examinations)
    .set({
      maxAttempts,
      durationMinutes: isNaN(durationMinutes) ? undefined : durationMinutes,
      isPublished,
      resultReleasePolicy: resultReleasePolicy || undefined,
      updatedAt: new Date(),
    })
    .where(eq(examinations.id, examId));

  revalidatePath("/admin/examinations");
  revalidatePath("/teacher/examinations");
  revalidatePath("/student/examinations");

  return { success: true };
}

// 2. Reset or Grant Extra Attempt for a specific student
export async function resetStudentAttemptAction(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "TEACHER"]);
  const attemptId = formData.get("attemptId") as string;
  const actionType = formData.get("actionType") as "DELETE_ATTEMPT" | "RESET_TO_IN_PROGRESS";

  if (!attemptId) {
    throw new Error("Attempt ID is required.");
  }

  if (actionType === "DELETE_ATTEMPT") {
    await db.delete(examinationAttempts).where(eq(examinationAttempts.id, attemptId));
  } else {
    // Re-open attempt
    await db
      .update(examinationAttempts)
      .set({
        status: "IN_PROGRESS",
        submittedAt: null,
        totalActiveTimeMs: 0,
        updatedAt: new Date(),
      })
      .where(eq(examinationAttempts.id, attemptId));
  }

  revalidatePath("/admin/examinations");
  revalidatePath("/teacher/examinations");
  revalidatePath("/student/examinations");

  return { success: true };
}

// 3. Update User Profile Status
export async function updateUserAdminAction(formData: FormData) {
  await requireRole(["SUPER_ADMIN"]);
  const userId = formData.get("userId") as string;
  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const isActive = formData.get("isActive") === "true";

  if (!userId) {
    throw new Error("User ID is required.");
  }

  await db
    .update(profiles)
    .set({
      fullName: fullName || undefined,
      phoneNumber: phoneNumber || undefined,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/parents");

  return { success: true };
}

// 4. Update Institution Settings
export async function updateInstitutionAction(formData: FormData) {
  await requireRole(["SUPER_ADMIN"]);
  const institutionId = formData.get("institutionId") as string;
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const contactEmail = formData.get("contactEmail") as string;

  if (!institutionId || !name) {
    throw new Error("Institution ID and Name are required.");
  }

  await db
    .update(institutions)
    .set({
      name,
      code: code || undefined,
      contactEmail: contactEmail || undefined,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, institutionId));

  revalidatePath("/admin/institutions");
  return { success: true };
}
