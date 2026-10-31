import type { ChangeEvent, FocusEvent } from "react";
import { TextField } from "@repo/ui/text-field";
import { ADMIN_FIELD_LABELS } from "../config/messages";

export type AdminInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: (element: HTMLInputElement | null) => void;
  error?: string;
};

export function AdminNameField(props: AdminInputProps) {
  return <TextField label={ADMIN_FIELD_LABELS.name} {...props} />;
}
