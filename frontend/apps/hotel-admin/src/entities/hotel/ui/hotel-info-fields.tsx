import type { ChangeEvent, FocusEvent } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import { TextareaField } from "@repo/ui/textarea-field";
import { HOTEL_FIELD_LABELS, HOTEL_INFO_MESSAGES } from "../config/messages";
import type { HotelInfoField } from "../model/hotel-info-form";

const DESCRIPTION_ROWS = 5;

type HotelInfoInputElement = HTMLInputElement | HTMLTextAreaElement;

export type HotelInfoInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<HotelInfoInputElement>) => void;
  onBlur?: (event: FocusEvent<HotelInfoInputElement>) => void;
  ref?: (element: HotelInfoInputElement | null) => void;
  error?: string;
};

type HotelInfoFieldsProps = {
  fields: Record<HotelInfoField, HotelInfoInputProps>;
};

export function HotelInfoFields({ fields }: HotelInfoFieldsProps) {
  return (
    <FormSection legend={HOTEL_INFO_MESSAGES.legend}>
      <TextField label={HOTEL_FIELD_LABELS.name} {...fields.name} />
      <TextField label={HOTEL_FIELD_LABELS.address} {...fields.address} />
      <TextField
        label={HOTEL_FIELD_LABELS.phone}
        hint={HOTEL_INFO_MESSAGES.phoneHint}
        {...fields.phone}
      />
      <TextareaField
        label={
          <>
            {HOTEL_FIELD_LABELS.description}{" "}
            <span className="font-normal text-neutral-500">
              {HOTEL_INFO_MESSAGES.optional}
            </span>
          </>
        }
        rows={DESCRIPTION_ROWS}
        {...fields.description}
      />
    </FormSection>
  );
}
