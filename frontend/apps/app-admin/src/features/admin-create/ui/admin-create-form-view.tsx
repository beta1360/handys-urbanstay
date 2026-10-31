import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { ADMIN_INFO_MESSAGES, AdminNameField } from "@/entities/admin";
import { ACCOUNT_FORM_MESSAGES, COMMON_MESSAGES } from "@/shared/config";
import { ADMIN_CREATE_FORM_MESSAGES } from "../config/messages";
import type { AdminCreateField } from "../model/admin-create-form-schema";

type AdminCreateFormViewProps = {
  fields: Record<AdminCreateField, FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: AdminCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <FormSection legend={ADMIN_INFO_MESSAGES.legend}>
        <TextField
          label={ACCOUNT_FORM_MESSAGES.loginIdLabel}
          type="email"
          autoComplete="off"
          hint={ADMIN_CREATE_FORM_MESSAGES.loginIdHint}
          {...fields.loginId}
        />
        <AdminNameField {...fields.name} />
        <TextField
          label={ACCOUNT_FORM_MESSAGES.initialPasswordLabel}
          type="password"
          autoComplete="new-password"
          hint={ADMIN_CREATE_FORM_MESSAGES.passwordHint}
          {...fields.password}
        />
      </FormSection>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {COMMON_MESSAGES.register}
        </Button>
        <ButtonLink
          to="/admins"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
