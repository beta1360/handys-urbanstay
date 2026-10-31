import { RoomLoading } from "@/entities/room";
import { useRoomList } from "../model/use-room-list";
import type { RoomListCriteria } from "../model/use-room-list";
import { RoomListEmpty } from "./room-list-empty";
import { RoomListLoadFailed } from "./room-list-load-failed";
import { RoomListPagination } from "./room-list-pagination";
import { RoomTable } from "./room-table";

export function RoomList({ keyword, status, page }: RoomListCriteria) {
  const state = useRoomList({ keyword, status, page });

  switch (state.status) {
    case "loading":
      return <RoomLoading />;
    case "failed":
      return <RoomListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <RoomListEmpty isFiltered={state.isFiltered} />;
    case "ready":
      return (
        <>
          <RoomTable rooms={state.rooms} isUpdating={state.isUpdating} />
          <RoomListPagination {...state.pagination} />
        </>
      );
  }
}
