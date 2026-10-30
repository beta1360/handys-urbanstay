import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@/shared/lib/form";
import { HOTEL_CREATE_FORM_MESSAGES } from "../config/messages";
import { MASTER_PASSWORD_LENGTH } from "../model/hotel-create-form-schema";
import type { MasterField } from "../model/hotel-create-form-schema";

type MasterAccountFieldsProps = {
  fields: Record<`master.${MasterField}`, FormFieldProps>;
};

export function MasterAccountFields({ fields }: MasterAccountFieldsProps) {
  return (
    <FormSection legend={HOTEL_CREATE_FORM_MESSAGES.masterLegend}>
      <TextField
        label={HOTEL_CREATE_FORM_MESSAGES.masterLoginIdLabel}
        type="email"
        autoComplete="off"
        hint={HOTEL_CREATE_FORM_MESSAGES.masterLoginIdHint}
        {...fields["master.loginId"]}
      />
      <TextField
        label={HOTEL_CREATE_FORM_MESSAGES.masterNameLabel}
        {...fields["master.name"]}
      />
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
    </FormSection>
  );
}
