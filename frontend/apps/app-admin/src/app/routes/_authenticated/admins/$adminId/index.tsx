import { createFileRoute } from "@tanstack/react-router";
import { ADMIN_DETAIL_MESSAGES, AdminDetailPage } from "@/pages/admin-detail";

export const Route = createFileRoute("/_authenticated/admins/$adminId/")({
  staticData: { title: ADMIN_DETAIL_MESSAGES.title },
  component: AdminDetailPage,
});
