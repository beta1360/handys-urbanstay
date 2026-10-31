import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  GUEST_LIST_DEFAULT_SEARCH,
  GUEST_LIST_MESSAGES,
  GuestListPage,
  guestListSearchSchema,
} from "@/pages/guest-list";

export const Route = createFileRoute("/_authenticated/guests/")({
  validateSearch: guestListSearchSchema,
  search: {
    middlewares: [stripSearchParams(GUEST_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: GUEST_LIST_MESSAGES.title },
  component: GuestListPage,
});
