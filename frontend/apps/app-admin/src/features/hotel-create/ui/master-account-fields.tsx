import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { HotelMasterInfoFields } from "@/entities/hotel-master";
import { HOTEL_CREATE_FORM_MESSAGES } from "../config/messages";
import { MASTER_PASSWORD_LENGTH } from "../model/hotel-create-form-schema";
import type { MasterField } from "../model/hotel-create-form-schema";

type MasterAccountFieldsProps = {
  fields: Record<`master.${MasterField}`, FormFieldProps>;
};

export function MasterAccountFields({ fields }: MasterAccountFieldsProps) {
  return (
    <HotelMasterInfoFields
      fields={{
        loginId: fields["master.loginId"],
        name: fields["master.name"],
      }}
    >
      <TextField
        label={HOTEL_CREATE_FORM_MESSAGES.masterPasswordLabel}
        type="password"
        autoComplete="new-password"
        hint={HOTEL_CREATE_FORM_MESSAGES.masterPasswordHint(
          MASTER_PASSWORD_LENGTH.min,
          MASTER_PASSWORD_LENGTH.max,
        )}
        {...fields["master.password"]}
      />
    </HotelMasterInfoFields>
  );
}
