import { TextField } from "@repo/ui/text-field";
import { TextareaField } from "@repo/ui/textarea-field";
import { HOTEL_INFO_MESSAGES } from "../config/messages";
import type { HotelInfoField, HotelInfoValues } from "../model/hotel-info-form";
import { FormSection } from "./form-section";

const DESCRIPTION_ROWS = 5;

type HotelInfoFieldsProps = {
  values: HotelInfoValues;
  errors: Partial<Record<HotelInfoField, string>>;
  onChange: (field: HotelInfoField, value: string) => void;
};

export function HotelInfoFields({
  values,
  errors,
  onChange,
}: HotelInfoFieldsProps) {
  return (
    <FormSection legend={HOTEL_INFO_MESSAGES.legend}>
      <TextField
        label={HOTEL_INFO_MESSAGES.nameLabel}
        name="name"
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
        error={errors.name}
      />
      <TextField
        label={HOTEL_INFO_MESSAGES.addressLabel}
        name="address"
        value={values.address}
        onChange={(event) => onChange("address", event.target.value)}
        error={errors.address}
      />
      <TextField
        label={HOTEL_INFO_MESSAGES.phoneLabel}
        name="phone"
        hint={HOTEL_INFO_MESSAGES.phoneHint}
        value={values.phone}
        onChange={(event) => onChange("phone", event.target.value)}
        error={errors.phone}
      />
      <TextareaField
        label={
          <>
            {HOTEL_INFO_MESSAGES.descriptionLabel}{" "}
            <span className="font-normal text-neutral-500">
              {HOTEL_INFO_MESSAGES.optional}
            </span>
          </>
        }
        name="description"
        rows={DESCRIPTION_ROWS}
        value={values.description}
        onChange={(event) => onChange("description", event.target.value)}
        error={errors.description}
      />
    </FormSection>
  );
}
