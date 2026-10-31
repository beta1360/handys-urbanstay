import type { FormFieldProps } from "@repo/admin-kit/form";
import {
  HotelMasterInfoFields,
  HotelMasterPasswordField,
} from "@/entities/hotel-master";
import { HOTEL_CREATE_FORM_MESSAGES } from "../config/messages";
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
      <HotelMasterPasswordField
        label={HOTEL_CREATE_FORM_MESSAGES.masterPasswordLabel}
        {...fields["master.password"]}
      />
    </HotelMasterInfoFields>
  );
}
