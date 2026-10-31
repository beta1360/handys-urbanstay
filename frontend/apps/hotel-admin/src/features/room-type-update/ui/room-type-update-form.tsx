import { RoomTypeNotFound } from "@/entities/room-type";
import type { RoomType } from "@/shared/api";
import { useRoomTypeUpdateForm } from "../model/use-room-type-update-form";
import { RoomTypeUpdateFormView } from "./room-type-update-form-view";

type RoomTypeUpdateFormProps = {
  roomTypeId: number;
  initialRoomType: RoomType;
};

export function RoomTypeUpdateForm({
  roomTypeId,
  initialRoomType,
}: RoomTypeUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useRoomTypeUpdateForm(roomTypeId, initialRoomType);

  if (status === "notFound") {
    return <RoomTypeNotFound />;
  }
  return (
    <RoomTypeUpdateFormView
      roomTypeId={roomTypeId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
