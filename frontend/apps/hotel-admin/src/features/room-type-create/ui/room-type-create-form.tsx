import { useRoomTypeCreateForm } from "../model/use-room-type-create-form";
import { RoomTypeCreateFormView } from "./room-type-create-form-view";

export function RoomTypeCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useRoomTypeCreateForm();

  return (
    <RoomTypeCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
