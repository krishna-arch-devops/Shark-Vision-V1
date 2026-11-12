import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "My Students",
  description: "Roster of candidates enrolled in your assigned batches",
  role: "TEACHER",
  emptyTitle: "No Students in Assigned Batches",
  emptyDescription: "Enrolled candidates in your batches will appear here with individual performance diagnostic reports.",
});
