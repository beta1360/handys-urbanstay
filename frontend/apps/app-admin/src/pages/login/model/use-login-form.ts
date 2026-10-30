import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useLogin } from "@/features/auth-login";
import { getApiError } from "@/shared/api";
import type { ApiError } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { LOGIN_FIELDS, loginFormSchema } from "./login-form-schema";
import type { LoginField, LoginFormValues } from "./login-form-schema";

type LoginFieldErrors = Partial<Record<LoginField, string>>;

const loginRoute = getRouteApi("/login");

const INITIAL_VALUES: LoginFormValues = { loginId: "", password: "" };

function isLoginField(field: string): field is LoginField {
  return LOGIN_FIELDS.some((loginField) => loginField === field);
}

function toLoginFieldErrors(fieldErrors: ApiError["fieldErrors"]) {
  const errors: LoginFieldErrors = {};
  for (const { field, message } of fieldErrors) {
    if (isLoginField(field)) {
      errors[field] ??= message;
    }
  }
  return errors;
}

export function useLoginForm() {
  const { redirect: redirectTo } = loginRoute.useSearch();
  const { login } = useLogin();
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function changeField(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showFieldErrors(errors: LoginFieldErrors) {
    setFieldErrors(errors);
    const firstInvalidField = LOGIN_FIELDS.find((field) => errors[field]);
    if (firstInvalidField === undefined) {
      return;
    }
    const fieldRefs = { loginId: loginIdRef, password: passwordRef };
    fieldRefs[firstInvalidField].current?.focus();
  }

  function showLoginError(error: unknown) {
    const apiError = getApiError(error);
    if (apiError === undefined) {
      setFormError(COMMON_MESSAGES.requestFailed);
      return;
    }
    const errors = toLoginFieldErrors(apiError.fieldErrors);
    if (LOGIN_FIELDS.some((field) => errors[field])) {
      showFieldErrors(errors);
      return;
    }
    setFormError(apiError.message);
  }

  async function submit() {
    setFormError(undefined);
    const result = loginFormSchema.safeParse(values);
    if (!result.success) {
      const issues = z.flattenError(result.error).fieldErrors;
      showFieldErrors({
        loginId: issues.loginId?.[0],
        password: issues.password?.[0],
      });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await login(values);
      await navigate({ href: redirectTo });
    } catch (error) {
      setIsSubmitting(false);
      showLoginError(error);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    void submit();
  }

  return {
    values,
    fieldErrors,
    formError,
    isSubmitting,
    loginIdRef,
    passwordRef,
    changeField,
    handleSubmit,
  };
}
