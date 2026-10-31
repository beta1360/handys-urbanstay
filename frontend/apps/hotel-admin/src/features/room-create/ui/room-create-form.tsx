import { useRoomCreateForm } from "../model/use-room-create-form";
import { RoomCreateFormView } from "./room-create-form-view";

export function RoomCreateForm() {
  const { fields, roomTypeOptions, roomTypeHint, isSubmitting, handleSubmit } =
    useRoomCreateForm();

  return (
    <RoomCreateFormView
      fields={fields}
      roomTypeOptions={roomTypeOptions}
      roomTypeHint={roomTypeHint}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
