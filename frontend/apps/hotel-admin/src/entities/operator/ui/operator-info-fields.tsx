import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import {
  OPERATOR_FIELD_LABELS,
  OPERATOR_INFO_MESSAGES,
} from "../config/messages";
import type { OperatorInfoField } from "../model/operator-info-form";

export type OperatorInfoInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: (element: HTMLInputElement | null) => void;
  error?: string;
};

type OperatorInfoFieldsProps = {
  fields: Record<OperatorInfoField, OperatorInfoInputProps>;
  loginIdHint?: string;
  children?: ReactNode;
};

export function OperatorInfoFields({
  fields,
  loginIdHint = OPERATOR_INFO_MESSAGES.loginIdHint,
  children,
}: OperatorInfoFieldsProps) {
  return (
    <FormSection legend={OPERATOR_INFO_MESSAGES.legend}>
      <TextField
        label={OPERATOR_INFO_MESSAGES.loginIdLabel}
        type="email"
        autoComplete="off"
        hint={loginIdHint}
        {...fields.loginId}
      />
      <TextField label={OPERATOR_FIELD_LABELS.name} {...fields.name} />
      {children}
    </FormSection>
  );
}
