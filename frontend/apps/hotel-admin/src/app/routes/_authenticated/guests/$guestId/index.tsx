import { createFileRoute } from "@tanstack/react-router";
import { GUEST_DETAIL_MESSAGES, GuestDetailPage } from "@/pages/guest-detail";

export const Route = createFileRoute("/_authenticated/guests/$guestId/")({
  staticData: { title: GUEST_DETAIL_MESSAGES.title },
  component: GuestDetailPage,
});
