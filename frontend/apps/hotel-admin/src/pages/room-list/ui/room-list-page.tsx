import { getRouteApi } from "@tanstack/react-router";
import { RoomSearchForm } from "@/features/room-search";
import { RoomList } from "@/widgets/room-list";

const roomListRoute = getRouteApi("/_authenticated/rooms/");

export function RoomListPage() {
  const { keyword, status, page } = roomListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <RoomSearchForm keyword={keyword} status={status} />
      </div>
      <RoomList keyword={keyword} status={status} page={page} />
    </div>
  );
}
