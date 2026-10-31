import {
  RoomInformation,
  RoomLoadFailed,
  RoomLoading,
  RoomNotFound,
  useRoom,
} from "@/entities/room";
import { RoomTypeTerms } from "@/entities/room-type";
import { RoomStatusChange } from "@/features/room-status-change";
import { RoomCurrentStay } from "./room-current-stay";
import { RoomDetailActions } from "./room-detail-actions";
import { RoomStatusHistory } from "./room-status-history";

type RoomDetailProps = {
  roomId: number;
  canEdit: boolean;
};

export function RoomDetail({ roomId, canEdit }: RoomDetailProps) {
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
          <RoomDetailActions roomId={state.room.id} canEdit={canEdit} />
          <RoomInformation
            room={state.room}
            roomTypeTerms={<RoomTypeTerms roomType={state.room.roomType} />}
          />
          <RoomCurrentStay currentStay={state.room.currentStay} />
          <RoomStatusChange room={state.room} />
          <RoomStatusHistory key={state.room.id} roomId={state.room.id} />
        </>
      );
  }
}
