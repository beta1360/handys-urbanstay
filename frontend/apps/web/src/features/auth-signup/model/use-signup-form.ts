import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { MEMBER_HINTS } from "@/entities/member";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
} from "@/shared/lib/form";
import { showToast } from "@/shared/lib/toast";
import { useSignup } from "../api/use-signup";
import {
  EMPTY_SIGNUP_VALUES,
  PASSWORD_LENGTH,
  SIGNUP_FIELDS,
  signupFormSchema,
} from "./signup-form-schema";

const FIELD_OF_ERROR_CODE = {
  [API_ERROR_CODES.memberEmailDuplicated]: "email",
} as const;

export function useSignupForm(redirectTo: string) {
  const { signup } = useSignup();
  const router = useRouter();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(signupFormSchema),
    defaultValues: EMPTY_SIGNUP_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, SIGNUP_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(async (body) => {
    try {
      const message = await signup(body);
      showToast(message);
      router.replace(redirectTo);
    } catch (error) {
      showSubmitError(getApiError(error), {
        fields: SIGNUP_FIELDS,
        setError: form.setError,
        fieldOfCode: FIELD_OF_ERROR_CODE,
      });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    void submit(event);
  }

  return {
    fields,
    passwordHint: MEMBER_HINTS.password(
      PASSWORD_LENGTH.min,
      PASSWORD_LENGTH.max,
    ),
    formAlert: formState.errors.root?.server?.message,
    isSubmitting,
    handleSubmit,
  };
}
