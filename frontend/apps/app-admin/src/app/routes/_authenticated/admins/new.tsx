import { createFileRoute } from "@tanstack/react-router";
import { ADMIN_CREATE_MESSAGES, AdminCreatePage } from "@/pages/admin-create";

export const Route = createFileRoute("/_authenticated/admins/new")({
  staticData: { title: ADMIN_CREATE_MESSAGES.title },
  component: AdminCreatePage,
});
