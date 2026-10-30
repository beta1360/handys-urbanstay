import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@/shared/lib/form";
import { LOGIN_MESSAGES } from "../config/messages";
import type { LoginField } from "../model/login-form-schema";

type LoginFormViewProps = {
  fields: Record<LoginField, FormFieldProps>;
  alert: string | undefined;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginFormView({
  fields,
  alert,
  isSubmitting,
  onSubmit,
}: LoginFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <TextField
        label={LOGIN_MESSAGES.loginIdLabel}
        type="email"
        autoComplete="username"
        {...fields.loginId}
      />
      <TextField
        label={LOGIN_MESSAGES.passwordLabel}
        type="password"
        autoComplete="current-password"
        {...fields.password}
      />
      {alert ? (
        <p role="alert" className="text-sm text-red-600">
          {alert}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        className="mt-2 w-full"
      >
        {LOGIN_MESSAGES.submit}
      </Button>
    </form>
  );
}
