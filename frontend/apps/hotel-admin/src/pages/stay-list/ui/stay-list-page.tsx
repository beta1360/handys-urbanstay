import { getRouteApi } from "@tanstack/react-router";
import { StayGuestFilter, StaySearchForm } from "@/features/stay-search";
import { StayList } from "@/widgets/stay-list";

const stayListRoute = getRouteApi("/_authenticated/stays/");

export function StayListPage() {
  const { roomId, guestId, canceled, page } = stayListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <StaySearchForm roomId={roomId} canceled={canceled} guestId={guestId} />
      </div>
      {guestId === undefined ? null : (
        <StayGuestFilter
          guestId={guestId}
          roomId={roomId}
          canceled={canceled}
        />
      )}
      <StayList
        roomId={roomId}
        guestId={guestId}
        canceled={canceled}
        page={page}
      />
    </div>
  );
}
