import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { OperatorInfoFields, OperatorPasswordField } from "@/entities/operator";
import type { OperatorInfoField } from "@/entities/operator";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_CREATE_FORM_MESSAGES } from "../config/messages";

type OperatorCreateFormViewProps = {
  fields: Record<OperatorInfoField | "password", FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OperatorCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: OperatorCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <OperatorInfoFields fields={fields}>
        <OperatorPasswordField
          label={OPERATOR_CREATE_FORM_MESSAGES.passwordLabel}
          {...fields.password}
        />
      </OperatorInfoFields>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {COMMON_MESSAGES.create}
        </Button>
        <ButtonLink
          to="/operators"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
