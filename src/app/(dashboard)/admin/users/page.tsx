import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "User Management",
  description: "Administrative directory of all registered students, teachers, and guardians",
  role: "SUPER_ADMIN",
  emptyTitle: "No External Users Provisioned",
  emptyDescription: "Users who sign up or are provisioned by institutions will be indexed here with granular permission controls.",
});
