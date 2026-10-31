import { TextField } from "@repo/ui/text-field";
import { HOTEL_MASTER_INFO_MESSAGES } from "../config/messages";
import { HOTEL_MASTER_PASSWORD_LENGTH } from "../lib/hotel-master-password";
import type { HotelMasterInputProps } from "./hotel-master-info-fields";

type HotelMasterPasswordFieldProps = HotelMasterInputProps & {
  label: string;
  hint?: string;
};

export function HotelMasterPasswordField({
  hint = HOTEL_MASTER_INFO_MESSAGES.passwordHint(
    HOTEL_MASTER_PASSWORD_LENGTH.min,
    HOTEL_MASTER_PASSWORD_LENGTH.max,
  ),
  ...props
}: HotelMasterPasswordFieldProps) {
  return (
    <TextField
      type="password"
      autoComplete="new-password"
      hint={hint}
      {...props}
    />
  );
}
