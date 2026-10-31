import {
  RoomTypeLoadFailed,
  RoomTypeLoading,
  RoomTypeNotFound,
  useRoomType,
} from "@/entities/room-type";
import { RoomTypeUpdateForm } from "./room-type-update-form";

type RoomTypeUpdateProps = {
  roomTypeId: number;
};

export function RoomTypeUpdate({ roomTypeId }: RoomTypeUpdateProps) {
  const state = useRoomType(roomTypeId);

  switch (state.status) {
    case "ready":
      return (
        <RoomTypeUpdateForm
          key={roomTypeId}
          roomTypeId={roomTypeId}
          initialRoomType={state.roomType}
        />
      );
    case "notFound":
      return <RoomTypeNotFound />;
    case "failed":
      return <RoomTypeLoadFailed onRetry={state.retry} />;
    case "loading":
      return <RoomTypeLoading />;
  }
}
