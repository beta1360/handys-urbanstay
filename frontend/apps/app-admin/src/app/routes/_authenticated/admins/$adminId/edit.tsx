import { createFileRoute } from "@tanstack/react-router";
import { ADMIN_EDIT_MESSAGES, AdminEditPage } from "@/pages/admin-edit";

export const Route = createFileRoute("/_authenticated/admins/$adminId/edit")({
  staticData: { title: ADMIN_EDIT_MESSAGES.title },
  component: AdminEditPage,
});
