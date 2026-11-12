import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Database Migration RLS and Schema Audits", () => {
  const migrationPath = path.resolve(__dirname, "../../supabase/migrations/20261112000001_initial_schema.sql");
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  it("should have RLS enabled on all core entities", () => {
    const requiredTables = [
      "profiles",
      "institutions",
      "institution_memberships",
      "batches",
      "batch_teachers",
      "batch_students",
      "parent_student_links",
      "subjects",
      "audit_logs",
      "platform_settings",
    ];

    for (const table of requiredTables) {
      const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, "i");
      expect(migrationContent).toMatch(rlsRegex);
    }
  });

  it("should contain handle_new_user trigger enforcing STUDENT role", () => {
    expect(migrationContent).toContain("'STUDENT'");
    expect(migrationContent).toContain("CREATE TRIGGER on_auth_user_created");
  });

  it("should contain teacher_teaches_student helper for resource isolation", () => {
    expect(migrationContent).toContain("FUNCTION public.teacher_teaches_student");
  });

  it("should enforce parent verified link requirement in policy", () => {
    expect(migrationContent).toContain("psl.is_verified = TRUE");
  });
});
