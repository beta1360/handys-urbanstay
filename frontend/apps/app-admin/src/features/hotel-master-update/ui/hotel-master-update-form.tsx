import { HotelNotFound } from "@/entities/hotel";
import type { HotelMaster } from "@/shared/api";
import { useHotelMasterUpdateForm } from "../model/use-hotel-master-update-form";
import { HotelMasterUpdateFormView } from "./hotel-master-update-form-view";

type HotelMasterUpdateFormProps = {
  hotelId: number;
  initialMaster: HotelMaster;
};

export function HotelMasterUpdateForm({
  hotelId,
  initialMaster,
}: HotelMasterUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useHotelMasterUpdateForm(hotelId, initialMaster);

  if (status === "notFound") {
    return <HotelNotFound />;
  }
  return (
    <HotelMasterUpdateFormView
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
