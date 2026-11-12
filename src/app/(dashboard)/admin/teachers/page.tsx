import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Teacher Management",
  description: "Authorized educators, subject designations, and institutional batch assignments",
  role: "SUPER_ADMIN",
  emptyTitle: "No Teachers Provisioned",
  emptyDescription: "Super administrators can invite and verify teachers to manage batches and question banks.",
});
