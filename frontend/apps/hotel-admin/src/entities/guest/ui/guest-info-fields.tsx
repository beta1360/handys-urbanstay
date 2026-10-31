import type { ChangeEvent, FocusEvent } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import { GUEST_FIELD_LABELS, GUEST_INFO_MESSAGES } from "../config/messages";
import type { GuestInfoField } from "../model/guest-info-form";

export type GuestInfoInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: (element: HTMLInputElement | null) => void;
  error?: string;
};

type GuestInfoFieldsProps = {
  fields: Record<GuestInfoField, GuestInfoInputProps>;
};

export function GuestInfoFields({ fields }: GuestInfoFieldsProps) {
  return (
    <FormSection legend={GUEST_INFO_MESSAGES.legend}>
      <TextField label={GUEST_FIELD_LABELS.name} {...fields.name} />
      <TextField
        label={GUEST_FIELD_LABELS.phone}
        hint={GUEST_INFO_MESSAGES.phoneHint}
        {...fields.phone}
      />
      <TextField
        label={GUEST_FIELD_LABELS.email}
        type="email"
        hint={GUEST_INFO_MESSAGES.emailHint}
        {...fields.email}
      />
    </FormSection>
  );
}
