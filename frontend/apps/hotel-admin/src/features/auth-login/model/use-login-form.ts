import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { getApiError } from "@/shared/api";
import { useLogin } from "../api/use-login";
import { LOGIN_FIELDS, loginFormSchema } from "./login-form-schema";

export function useLoginForm(redirectTo: string) {
  const { login } = useLogin();
  const navigate = useNavigate();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(loginFormSchema),
    defaultValues: { loginId: "", password: "" },
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, LOGIN_FIELDS);
  const alert = formState.errors.root?.server?.message;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(async (body) => {
    try {
      const { message } = await login(body);
      showToast({ type: "success", message });
      await navigate({ href: redirectTo });
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

  return { fields, alert, isSubmitting, handleSubmit };
}
