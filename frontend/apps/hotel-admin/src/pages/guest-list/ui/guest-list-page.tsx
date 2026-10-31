import { getRouteApi } from "@tanstack/react-router";
import { GuestSearchForm } from "@/features/guest-search";
import { GuestList } from "@/widgets/guest-list";

const guestListRoute = getRouteApi("/_authenticated/guests/");

export function GuestListPage() {
  const { keyword, page } = guestListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <GuestSearchForm keyword={keyword} />
      </div>
      <GuestList keyword={keyword} page={page} />
    </div>
  );
}
