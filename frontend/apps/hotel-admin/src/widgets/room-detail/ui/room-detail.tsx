import {
  RoomInformation,
  RoomLoadFailed,
  RoomLoading,
  RoomNotFound,
  useRoom,
} from "@/entities/room";
import { RoomStatusChange } from "@/features/room-status-change";
import { RoomCurrentStay } from "./room-current-stay";
import { RoomDetailActions } from "./room-detail-actions";
import { RoomStatusHistory } from "./room-status-history";

type RoomDetailProps = {
  roomId: number;
};

export function RoomDetail({ roomId }: RoomDetailProps) {
  const state = useRoom(roomId);

  switch (state.status) {
    case "notFound":
      return <RoomNotFound />;
    case "loading":
      return (
        <>
          <RoomDetailActions />
          <RoomLoading />
        </>
      );
    case "failed":
      return (
        <>
          <RoomDetailActions />
          <RoomLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <RoomDetailActions editRoomId={state.room.id} />
          <RoomInformation room={state.room} />
          <RoomCurrentStay currentStay={state.room.currentStay} />
          <RoomStatusChange room={state.room} />
          <RoomStatusHistory key={state.room.id} roomId={state.room.id} />
        </>
      );
  }
}
