import { RoomNotFound } from "@/entities/room";
import type { Room } from "@/shared/api";
import { useRoomUpdateForm } from "../model/use-room-update-form";
import { RoomUpdateFormView } from "./room-update-form-view";

type RoomUpdateFormProps = {
  roomId: number;
  initialRoom: Room;
};

export function RoomUpdateForm({ roomId, initialRoom }: RoomUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useRoomUpdateForm(roomId, initialRoom);

  if (status === "notFound") {
    return <RoomNotFound />;
  }
  return (
    <RoomUpdateFormView
      roomId={roomId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
