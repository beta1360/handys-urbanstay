import { createFileRoute } from "@tanstack/react-router";
import { GUEST_CREATE_MESSAGES, GuestCreatePage } from "@/pages/guest-create";

export const Route = createFileRoute("/_authenticated/guests/new")({
  staticData: { title: GUEST_CREATE_MESSAGES.title },
  component: GuestCreatePage,
});
