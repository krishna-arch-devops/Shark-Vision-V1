export type UserRole = "SUPER_ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

export function getDashboardPathForRole(role: UserRole | string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    case "STUDENT":
      return "/student";
    default:
      return "/student";
  }
}
