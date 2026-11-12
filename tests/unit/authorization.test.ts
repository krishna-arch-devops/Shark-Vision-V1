import { describe, it, expect } from "vitest";
import { getDashboardPathForRole } from "@/lib/auth/session";
import { UserRole } from "@/types/database";

describe("Role-Based Authorization & Routing Logic", () => {
  it("should map SUPER_ADMIN to /admin", () => {
    expect(getDashboardPathForRole("SUPER_ADMIN")).toBe("/admin");
  });

  it("should map TEACHER to /teacher", () => {
    expect(getDashboardPathForRole("TEACHER")).toBe("/teacher");
  });

  it("should map PARENT to /parent", () => {
    expect(getDashboardPathForRole("PARENT")).toBe("/parent");
  });

  it("should map STUDENT to /student", () => {
    expect(getDashboardPathForRole("STUDENT")).toBe("/student");
  });

  it("should default unknown roles safely to /student", () => {
    expect(getDashboardPathForRole("UNKNOWN" as UserRole)).toBe("/student");
  });

  it("should enforce distinct URL paths for each of the four roles", () => {
    const roles: UserRole[] = ["SUPER_ADMIN", "TEACHER", "PARENT", "STUDENT"];
    const paths = roles.map(getDashboardPathForRole);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(4);
  });
});
