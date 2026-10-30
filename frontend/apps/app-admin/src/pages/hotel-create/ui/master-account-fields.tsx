import { TextField } from "@repo/ui/text-field";
import { HOTEL_CREATE_MESSAGES } from "../config/messages";
import { MASTER_PASSWORD_LENGTH } from "../model/hotel-create-form-schema";
import type {
  HotelCreateFieldErrors,
  HotelCreateFormValues,
  MasterField,
} from "../model/hotel-create-form-schema";
import { FormSection } from "./form-section";

type MasterAccountFieldsProps = {
  values: HotelCreateFormValues["master"];
  errors: HotelCreateFieldErrors;
  onChange: (field: MasterField, value: string) => void;
};

export function MasterAccountFields({
  values,
  errors,
  onChange,
}: MasterAccountFieldsProps) {
  return (
    <FormSection legend={HOTEL_CREATE_MESSAGES.masterLegend}>
      <TextField
        label={HOTEL_CREATE_MESSAGES.masterLoginIdLabel}
        type="email"
        name="master.loginId"
        autoComplete="off"
        hint={HOTEL_CREATE_MESSAGES.masterLoginIdHint}
        value={values.loginId}
        onChange={(event) => onChange("loginId", event.target.value)}
        error={errors["master.loginId"]}
      />
      <TextField
        label={HOTEL_CREATE_MESSAGES.masterNameLabel}
        name="master.name"
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
        error={errors["master.name"]}
      />
      <TextField
        label={HOTEL_CREATE_MESSAGES.masterPasswordLabel}
        type="password"
        name="master.password"
        autoComplete="new-password"
        hint={HOTEL_CREATE_MESSAGES.masterPasswordHint(
          MASTER_PASSWORD_LENGTH.min,
          MASTER_PASSWORD_LENGTH.max,
        )}
        value={values.password}
        onChange={(event) => onChange("password", event.target.value)}
        error={errors["master.password"]}
      />
    </FormSection>
  );
}
