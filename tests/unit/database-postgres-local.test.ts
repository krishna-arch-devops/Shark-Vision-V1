import { describe, it, expect, beforeAll } from "vitest";
import { pool } from "@/lib/db";
import {
  authenticateLocalUser,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/local-auth";

describe("PostgreSQL Local Database & Auth Integration", () => {
  beforeAll(async () => {
    const client = await pool.connect();
    client.release();
  });

  it("should successfully query PostgreSQL 16 database", async () => {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT current_database(), version();");
      expect(res.rows[0].current_database).toBe("sharkvision");
      expect(res.rows[0].version).toContain("PostgreSQL");
    } finally {
      client.release();
    }
  });

  it("should verify password hashing and verification works deterministically", async () => {
    const pass = "SharkVision@2026";
    const hash = await hashPassword(pass);
    const isValid = await verifyPassword(pass, hash);
    const isInvalid = await verifyPassword("WrongPassword", hash);

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it("should authenticate seeded Super Admin from PostgreSQL", async () => {
    const user = await authenticateLocalUser("admin@sharkvision.com", "SharkVision@2026");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("SUPER_ADMIN");
  });

  it("should authenticate seeded Student and verify token generation", async () => {
    const student = await authenticateLocalUser("student.aarav@sharkvision.com", "SharkVision@2026");
    expect(student).not.toBeNull();
    expect(student?.role).toBe("STUDENT");

    if (student) {
      const token = await createSessionToken(student);
      const verified = await verifySessionToken(token);
      expect(verified?.email).toBe("student.aarav@sharkvision.com");
      expect(verified?.role).toBe("STUDENT");
    }
  });

  it("should reject authentication with invalid credentials", async () => {
    const failedUser = await authenticateLocalUser("admin@sharkvision.com", "WrongPassword");
    expect(failedUser).toBeNull();
  });
});
