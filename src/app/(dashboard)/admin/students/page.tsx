import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Student Directory",
  description: "Directory of enrolled candidates across JEE and NEET streams",
  role: "SUPER_ADMIN",
  emptyTitle: "No Active Student Records",
  emptyDescription: "Students enrolled across platform batches will be monitored here.",
});
