import { useHotelCreateForm } from "../model/use-hotel-create-form";
import { HotelCreateFormView } from "./hotel-create-form-view";

export function HotelCreateForm() {
  const { fields, alert, isSubmitting, handleSubmit } = useHotelCreateForm();

  return (
    <HotelCreateFormView
      fields={fields}
      alert={alert}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
