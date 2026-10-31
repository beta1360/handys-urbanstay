import { createFileRoute } from "@tanstack/react-router";
import { GUEST_EDIT_MESSAGES, GuestEditPage } from "@/pages/guest-edit";

export const Route = createFileRoute("/_authenticated/guests/$guestId/edit")({
  staticData: { title: GUEST_EDIT_MESSAGES.title },
  component: GuestEditPage,
});
