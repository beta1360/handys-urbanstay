import { useRoomCreateForm } from "../model/use-room-create-form";
import { RoomCreateFormView } from "./room-create-form-view";

export function RoomCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useRoomCreateForm();

  return (
    <RoomCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
