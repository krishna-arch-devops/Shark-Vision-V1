import { createPlaceholderPage } from "@/components/dashboard/placeholder-page";

export default createPlaceholderPage({
  title: "Platform Settings",
  description: "Global runtime parameters, authentication rules, and examination defaults",
  role: "SUPER_ADMIN",
  emptyTitle: "Platform Settings Standard",
  emptyDescription: "Environment configuration is managed via database table public.platform_settings.",
});
