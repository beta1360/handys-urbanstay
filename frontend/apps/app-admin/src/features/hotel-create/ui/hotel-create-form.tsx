import { useHotelCreateForm } from "../model/use-hotel-create-form";
import { HotelCreateFormView } from "./hotel-create-form-view";

export function HotelCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useHotelCreateForm();

  return (
    <HotelCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
