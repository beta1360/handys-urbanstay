import {
  RoomTypeInformation,
  RoomTypeLoadFailed,
  RoomTypeLoading,
  RoomTypeNotFound,
  useRoomType,
} from "@/entities/room-type";
import { RoomTypeDetailActions } from "./room-type-detail-actions";

type RoomTypeDetailProps = {
  roomTypeId: number;
};

export function RoomTypeDetail({ roomTypeId }: RoomTypeDetailProps) {
  const state = useRoomType(roomTypeId);

  switch (state.status) {
    case "notFound":
      return <RoomTypeNotFound />;
    case "loading":
      return (
        <>
          <RoomTypeDetailActions />
          <RoomTypeLoading />
        </>
      );
    case "failed":
      return (
        <>
          <RoomTypeDetailActions />
          <RoomTypeLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <RoomTypeDetailActions editRoomTypeId={state.roomType.id} />
          <RoomTypeInformation roomType={state.roomType} />
        </>
      );
  }
}
