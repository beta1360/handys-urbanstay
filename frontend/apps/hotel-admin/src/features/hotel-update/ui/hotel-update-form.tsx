import type { Hotel } from "@/shared/api";
import { useHotelUpdateForm } from "../model/use-hotel-update-form";
import { HotelUpdateFormView } from "./hotel-update-form-view";

type HotelUpdateFormProps = {
  initialHotel: Hotel;
};

export function HotelUpdateForm({ initialHotel }: HotelUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useHotelUpdateForm(initialHotel);

  return (
    <HotelUpdateFormView
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
