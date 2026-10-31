import { getRouteApi } from "@tanstack/react-router";
import { StayGuestFilter, StaySearchForm } from "@/features/stay-search";
import { StayList } from "@/widgets/stay-list";

const stayListRoute = getRouteApi("/_authenticated/stays/");

export function StayListPage() {
  const search = stayListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <StaySearchForm {...search} />
      </div>
      {search.guestId === undefined ? null : (
        <StayGuestFilter {...search} guestId={search.guestId} />
      )}
      <StayList {...search} />
    </div>
  );
}
