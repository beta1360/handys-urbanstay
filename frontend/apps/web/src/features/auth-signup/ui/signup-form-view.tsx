import type { FormEvent } from "react";
import { MEMBER_HINTS, MEMBER_LABELS } from "@/entities/member";
import { COMMON_MESSAGES } from "@/shared/config";
import type { FormFieldProps } from "@/shared/lib/form";
import { Button, TextField } from "@/shared/ui";
import type { SignupField } from "../model/signup-form-schema";

type SignupFormViewProps = {
  fields: Record<SignupField, FormFieldProps>;
  passwordHint: string;
  formAlert: string | undefined;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SignupFormView({
  fields,
  passwordHint,
  formAlert,
  isSubmitting,
  onSubmit,
}: SignupFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField
        label={MEMBER_LABELS.email}
        type="email"
        autoComplete="email"
        hint={MEMBER_HINTS.email}
        {...fields.email}
      />
      <TextField
        label={MEMBER_LABELS.password}
        type="password"
        autoComplete="new-password"
        hint={passwordHint}
        {...fields.password}
      />
      <TextField
        label={MEMBER_LABELS.name}
        autoComplete="name"
        {...fields.name}
      />
      <TextField
        label={MEMBER_LABELS.phone}
        type="tel"
        autoComplete="tel"
        hint={MEMBER_HINTS.phone}
        {...fields.phone}
      />
      {formAlert ? (
        <p role="alert" className="text-sm text-red-600">
          {formAlert}
        </p>
      ) : null}
      <Button type="submit" variant="primary" loading={isSubmitting}>
        {COMMON_MESSAGES.signup}
      </Button>
    </form>
  );
}
