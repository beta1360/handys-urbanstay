import type { Room } from "@/shared/api";
import { useRoomStatusChange } from "../model/use-room-status-change";
import { RoomStatusChangeView } from "./room-status-change-view";

type RoomStatusChangeProps = {
  room: Room;
};

export function RoomStatusChange({ room }: RoomStatusChangeProps) {
  const { status, nextStatuses, change } = useRoomStatusChange(room);

  return (
    <RoomStatusChangeView
      status={status}
      nextStatuses={nextStatuses}
      onChange={change}
    />
  );
}
