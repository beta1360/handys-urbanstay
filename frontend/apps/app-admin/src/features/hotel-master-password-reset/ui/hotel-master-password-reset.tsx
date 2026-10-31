import { useHotelMasterPasswordResetForm } from "../model/use-hotel-master-password-reset-form";
import { HotelMasterPasswordResetView } from "./hotel-master-password-reset-view";

type HotelMasterPasswordResetProps = {
  hotelId: number;
};

export function HotelMasterPasswordReset({
  hotelId,
}: HotelMasterPasswordResetProps) {
  const { fields, status, handleSubmit } =
    useHotelMasterPasswordResetForm(hotelId);

  return (
    <HotelMasterPasswordResetView
      fields={fields}
      status={status}
      onSubmit={handleSubmit}
    />
  );
}
