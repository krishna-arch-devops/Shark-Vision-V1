import { describe, it, expect } from "vitest";
import {
  LoginSchema,
  StudentRegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/validation/auth";

describe("Authentication Validation Schemas", () => {
  describe("LoginSchema", () => {
    it("should accept valid email and password", () => {
      const res = LoginSchema.safeParse({
        email: "test@sharkvision.in",
        password: "ValidPassword123",
      });
      expect(res.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const res = LoginSchema.safeParse({
        email: "not-an-email",
        password: "ValidPassword123",
      });
      expect(res.success).toBe(false);
    });

    it("should reject short password", () => {
      const res = LoginSchema.safeParse({
        email: "test@sharkvision.in",
        password: "123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("StudentRegisterSchema (Security Enforcement)", () => {
    it("should accept valid student payload", () => {
      const res = StudentRegisterSchema.safeParse({
        fullName: "Aarav Sharma",
        email: "aarav@example.com",
        password: "SecretPassword1",
        confirmPassword: "SecretPassword1",
        phoneNumber: "9876543210",
        targetExam: "JEE_MAIN",
      });
      expect(res.success).toBe(true);
    });

    it("should reject password mismatch", () => {
      const res = StudentRegisterSchema.safeParse({
        fullName: "Aarav Sharma",
        email: "aarav@example.com",
        password: "SecretPassword1",
        confirmPassword: "DifferentPassword2",
        targetExam: "JEE_MAIN",
      });
      expect(res.success).toBe(false);
    });

    it("should reject invalid phone number format", () => {
      const res = StudentRegisterSchema.safeParse({
        fullName: "Aarav Sharma",
        email: "aarav@example.com",
        password: "SecretPassword1",
        confirmPassword: "SecretPassword1",
        phoneNumber: "12345", // invalid Indian phone number
        targetExam: "NEET",
      });
      expect(res.success).toBe(false);
    });

    it("should not allow client to submit arbitrary role field", () => {
      const payload: any = {
        fullName: "Hacker User",
        email: "hacker@example.com",
        password: "SecretPassword1",
        confirmPassword: "SecretPassword1",
        role: "SUPER_ADMIN", // Malicious attempt to elevate role
      };
      const res = StudentRegisterSchema.safeParse(payload);
      expect(res.success).toBe(true);
      // Ensure the validated data strips or ignores the unauthorized role property
      expect((res as any).data.role).toBeUndefined();
    });
  });

  describe("ForgotPasswordSchema & ResetPasswordSchema", () => {
    it("should validate email in forgot password", () => {
      expect(ForgotPasswordSchema.safeParse({ email: "valid@mail.com" }).success).toBe(true);
      expect(ForgotPasswordSchema.safeParse({ email: "invalid-mail" }).success).toBe(false);
    });

    it("should enforce strong password rules in reset password", () => {
      expect(
        ResetPasswordSchema.safeParse({
          password: "Weak",
          confirmPassword: "Weak",
        }).success
      ).toBe(false);

      expect(
        ResetPasswordSchema.safeParse({
          password: "StrongPassword1",
          confirmPassword: "StrongPassword1",
        }).success
      ).toBe(true);
    });
  });
});
