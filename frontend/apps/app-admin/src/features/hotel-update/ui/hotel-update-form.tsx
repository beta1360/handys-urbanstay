import { HotelNotFound } from "@/entities/hotel";
import type { Hotel } from "@/shared/api";
import { useHotelUpdateForm } from "../model/use-hotel-update-form";
import { HotelUpdateFormView } from "./hotel-update-form-view";

type HotelUpdateFormProps = {
  hotelId: number;
  initialHotel: Hotel;
};

export function HotelUpdateForm({
  hotelId,
  initialHotel,
}: HotelUpdateFormProps) {
  const {
    fields,
    alert,
    status,
    reloadButtonRef,
    handleSubmit,
    reload,
  } = useHotelUpdateForm(hotelId, initialHotel);

  if (status === "notFound") {
    return <HotelNotFound />;
  }
  return (
    <HotelUpdateFormView
      hotelId={hotelId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
