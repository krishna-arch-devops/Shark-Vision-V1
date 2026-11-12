import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Institution Management",
  description: "Configure partner coaching centers, colleges, and schools",
  role: "SUPER_ADMIN",
  emptyTitle: "No Partner Institutions Configured",
  emptyDescription: "Institutions configured with custom exam schemes and batch trees will appear here.",
});
