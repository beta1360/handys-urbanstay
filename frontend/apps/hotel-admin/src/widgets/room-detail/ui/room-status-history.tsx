import { RoomLoading } from "@/entities/room";
import { ROOM_STATUS_HISTORY_MESSAGES } from "../config/messages";
import { useRoomStatusHistory } from "../model/use-room-status-history";
import type { RoomStatusHistoryState } from "../model/use-room-status-history";
import { RoomStatusHistoryEmpty } from "./room-status-history-empty";
import { RoomStatusHistoryLoadFailed } from "./room-status-history-load-failed";
import { RoomStatusHistoryPagination } from "./room-status-history-pagination";
import { RoomStatusHistoryTable } from "./room-status-history-table";

type RoomStatusHistoryContentProps = {
  state: RoomStatusHistoryState;
};

function RoomStatusHistoryContent({ state }: RoomStatusHistoryContentProps) {
  switch (state.status) {
    case "loading":
      return <RoomLoading />;
    case "failed":
      return <RoomStatusHistoryLoadFailed onRetry={state.retry} />;
    case "empty":
      return <RoomStatusHistoryEmpty />;
    case "ready":
      return (
        <>
          <RoomStatusHistoryTable
            histories={state.histories}
            isUpdating={state.isUpdating}
          />
          <RoomStatusHistoryPagination {...state.pagination} />
        </>
      );
  }
}

type RoomStatusHistoryProps = {
  roomId: number;
};

export function RoomStatusHistory({ roomId }: RoomStatusHistoryProps) {
  const state = useRoomStatusHistory(roomId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-neutral-600">
        {ROOM_STATUS_HISTORY_MESSAGES.title}
      </h2>
      <RoomStatusHistoryContent state={state} />
    </section>
  );
}
