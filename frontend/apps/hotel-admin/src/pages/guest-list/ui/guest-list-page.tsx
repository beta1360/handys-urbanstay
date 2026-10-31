import { getRouteApi } from "@tanstack/react-router";
import { ButtonLink } from "@repo/admin-kit/link";
import { GuestSearchForm } from "@/features/guest-search";
import { GuestList } from "@/widgets/guest-list";
import { GUEST_LIST_MESSAGES } from "../config/messages";

const guestListRoute = getRouteApi("/_authenticated/guests/");

export function GuestListPage() {
  const { keyword, page } = guestListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <GuestSearchForm keyword={keyword} />
        <ButtonLink to="/guests/new" variant="primary">
          {GUEST_LIST_MESSAGES.create}
        </ButtonLink>
      </div>
      <GuestList keyword={keyword} page={page} />
    </div>
  );
}
