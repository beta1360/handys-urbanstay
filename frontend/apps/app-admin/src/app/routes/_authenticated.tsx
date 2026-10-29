import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/widgets/admin-layout";

export const Route = createFileRoute("/_authenticated")({
  component: AdminLayout,
});
