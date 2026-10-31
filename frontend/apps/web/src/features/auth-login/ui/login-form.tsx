"use client";

import { useLoginForm } from "../model/use-login-form";
import { LoginFormView } from "./login-form-view";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const { fields, formAlert, isSubmitting, handleSubmit } =
    useLoginForm(redirectTo);

  return (
    <LoginFormView
      fields={fields}
      formAlert={formAlert}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
