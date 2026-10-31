import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getApiError } from "@/shared/api";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
} from "@/shared/lib/form";
import { useLogin } from "../api/use-login";
import {
  EMPTY_LOGIN_VALUES,
  LOGIN_FIELDS,
  loginFormSchema,
} from "./login-form-schema";

export function useLoginForm(redirectTo: string) {
  const { login } = useLogin();
  const router = useRouter();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(loginFormSchema),
    defaultValues: EMPTY_LOGIN_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, LOGIN_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(async (body) => {
    try {
      await login(body);
      router.replace(redirectTo);
    } catch (error) {
      showSubmitError(getApiError(error), {
        fields: LOGIN_FIELDS,
        setError: form.setError,
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
    formAlert: formState.errors.root?.server?.message,
    isSubmitting,
    handleSubmit,
  };
}
