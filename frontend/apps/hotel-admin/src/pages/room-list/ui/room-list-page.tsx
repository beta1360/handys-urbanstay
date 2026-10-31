import { getRouteApi } from "@tanstack/react-router";
import { ButtonLink } from "@repo/admin-kit/link";
import { RoomSearchForm } from "@/features/room-search";
import { RoomList } from "@/widgets/room-list";
import { ROOM_LIST_MESSAGES } from "../config/messages";

const roomListRoute = getRouteApi("/_authenticated/rooms/");

export function RoomListPage() {
  const { keyword, status, page } = roomListRoute.useSearch();
  const { isMaster } = roomListRoute.useRouteContext();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <RoomSearchForm keyword={keyword} status={status} />
        {isMaster ? (
          <ButtonLink to="/rooms/new" variant="primary">
            {ROOM_LIST_MESSAGES.create}
          </ButtonLink>
        ) : null}
      </div>
      <RoomList keyword={keyword} status={status} page={page} />
    </div>
  );
}
