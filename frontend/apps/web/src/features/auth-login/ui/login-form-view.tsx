import type { FormEvent } from "react";
import { MEMBER_LABELS } from "@/entities/member";
import { COMMON_MESSAGES } from "@/shared/config";
import type { FormFieldProps } from "@/shared/lib/form";
import { Button, TextField } from "@/shared/ui";
import type { LoginField } from "../model/login-form-schema";

type LoginFormViewProps = {
  fields: Record<LoginField, FormFieldProps>;
  formAlert: string | undefined;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginFormView({
  fields,
  formAlert,
  isSubmitting,
  onSubmit,
}: LoginFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField
        label={MEMBER_LABELS.email}
        type="email"
        autoComplete="username"
        {...fields.email}
      />
      <TextField
        label={MEMBER_LABELS.password}
        type="password"
        autoComplete="current-password"
        {...fields.password}
      />
      {formAlert ? (
        <p role="alert" className="text-sm text-red-600">
          {formAlert}
        </p>
      ) : null}
      <Button type="submit" variant="primary" loading={isSubmitting}>
        {COMMON_MESSAGES.login}
      </Button>
    </form>
  );
}
