import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/widgets/admin-layout";
import { ensureLoggedIn } from "../auth/login-guard";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) =>
    ensureLoggedIn(context.queryClient, location),
  component: AdminLayout,
});
