import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Batch Examinations",
  description: "Manage upcoming, live, and concluded assessments",
  role: "TEACHER",
  emptyTitle: "No Active Examinations",
  emptyDescription: "Tests assigned to your batches will be monitored here with live completion indicators.",
});
