import {
  RoomInformation,
  RoomLoadFailed,
  RoomLoading,
  RoomNotFound,
  useRoom,
} from "@/entities/room";
import { RoomDetailActions } from "./room-detail-actions";

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
        </>
      );
  }
}
