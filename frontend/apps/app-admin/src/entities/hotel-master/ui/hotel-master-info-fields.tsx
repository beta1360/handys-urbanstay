import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import {
  HOTEL_MASTER_FIELD_LABELS,
  HOTEL_MASTER_INFO_MESSAGES,
} from "../config/messages";
import type { HotelMasterInfoField } from "../model/hotel-master-info-form";

export type HotelMasterInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: (element: HTMLInputElement | null) => void;
  error?: string;
};

type HotelMasterInfoFieldsProps = {
  fields: Record<HotelMasterInfoField, HotelMasterInputProps>;
  loginIdHint?: string;
  children?: ReactNode;
};

export function HotelMasterInfoFields({
  fields,
  loginIdHint = HOTEL_MASTER_INFO_MESSAGES.loginIdHint,
  children,
}: HotelMasterInfoFieldsProps) {
  return (
    <FormSection legend={HOTEL_MASTER_INFO_MESSAGES.legend}>
      <TextField
        label={HOTEL_MASTER_INFO_MESSAGES.loginIdLabel}
        type="email"
        autoComplete="off"
        hint={loginIdHint}
        {...fields.loginId}
      />
      <TextField label={HOTEL_MASTER_FIELD_LABELS.name} {...fields.name} />
      {children}
    </FormSection>
  );
}
