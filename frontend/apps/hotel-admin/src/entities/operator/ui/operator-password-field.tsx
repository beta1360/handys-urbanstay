import { TextField } from "@repo/ui/text-field";
import { OPERATOR_INFO_MESSAGES } from "../config/messages";
import { OPERATOR_PASSWORD_LENGTH } from "../lib/operator-password";
import type { OperatorInfoInputProps } from "./operator-info-fields";

type OperatorPasswordFieldProps = OperatorInfoInputProps & {
  label: string;
};

export function OperatorPasswordField(props: OperatorPasswordFieldProps) {
  return (
    <TextField
      type="password"
      autoComplete="new-password"
      hint={OPERATOR_INFO_MESSAGES.passwordHint(
        OPERATOR_PASSWORD_LENGTH.min,
        OPERATOR_PASSWORD_LENGTH.max,
      )}
      {...props}
    />
  );
}
