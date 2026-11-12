import { z } from "zod";

export const RoleSchema = z.enum(["SUPER_ADMIN", "TEACHER", "PARENT", "STUDENT"]);

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const StudentRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number")
    .optional()
    .or(z.literal("")),
  targetExam: z.enum(["JEE_MAIN", "JEE_ADVANCED", "NEET", "FOUNDATION"]).default("JEE_MAIN"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number")
    .optional()
    .or(z.literal("")),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type StudentRegisterInput = z.infer<typeof StudentRegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
