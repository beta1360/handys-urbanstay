"use client";

import { useSignupForm } from "../model/use-signup-form";
import { SignupFormView } from "./signup-form-view";

type SignupFormProps = {
  redirectTo: string;
};

export function SignupForm({ redirectTo }: SignupFormProps) {
  const { fields, passwordHint, formAlert, isSubmitting, handleSubmit } =
    useSignupForm(redirectTo);

  return (
    <SignupFormView
      fields={fields}
      passwordHint={passwordHint}
      formAlert={formAlert}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
