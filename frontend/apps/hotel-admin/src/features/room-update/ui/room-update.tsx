import {
  RoomLoadFailed,
  RoomLoading,
  RoomNotFound,
  useRoom,
} from "@/entities/room";
import { RoomUpdateForm } from "./room-update-form";

type RoomUpdateProps = {
  roomId: number;
};

export function RoomUpdate({ roomId }: RoomUpdateProps) {
  const state = useRoom(roomId);

  switch (state.status) {
    case "ready":
      return (
        <RoomUpdateForm key={roomId} roomId={roomId} initialRoom={state.room} />
      );
    case "notFound":
      return <RoomNotFound />;
    case "failed":
      return <RoomLoadFailed onRetry={state.retry} />;
    case "loading":
      return <RoomLoading />;
  }
}
