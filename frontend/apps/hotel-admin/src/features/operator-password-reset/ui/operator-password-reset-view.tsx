import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { FormSection } from "@repo/ui/form-section";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { OperatorPasswordField } from "@/entities/operator";
import { OPERATOR_PASSWORD_RESET_MESSAGES } from "../config/messages";
import type { OperatorPasswordResetStatus } from "../model/use-operator-password-reset-form";

type OperatorPasswordResetViewProps = {
  fields: Record<"password", FormFieldProps>;
  status: OperatorPasswordResetStatus;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OperatorPasswordResetView({
  fields,
  status,
  onSubmit,
}: OperatorPasswordResetViewProps) {
  return (
    <form noValidate onSubmit={onSubmit}>
      <FormSection legend={OPERATOR_PASSWORD_RESET_MESSAGES.legend}>
        <OperatorPasswordField
          label={OPERATOR_PASSWORD_RESET_MESSAGES.passwordLabel}
          {...fields.password}
        />
        <div>
          <Button
            type="submit"
            variant="secondary"
            loading={status === "submitting"}
          >
            {OPERATOR_PASSWORD_RESET_MESSAGES.submit}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
