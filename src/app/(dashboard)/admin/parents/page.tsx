import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Parent & Guardian Verification",
  description: "Review and approve parent-student relationship linking requests",
  role: "SUPER_ADMIN",
  emptyTitle: "No Linking Requests Pending",
  emptyDescription: "Parent verification workflows and audit records will appear here.",
});
