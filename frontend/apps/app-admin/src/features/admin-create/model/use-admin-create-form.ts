import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useCreateAdmin } from "../api/use-create-admin";
import {
  ADMIN_CREATE_FIELDS,
  adminCreateFormSchema,
  EMPTY_ADMIN_CREATE_VALUES,
} from "./admin-create-form-schema";

export function useAdminCreateForm() {
  const { create } = useCreateAdmin();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(adminCreateFormSchema),
    defaultValues: EMPTY_ADMIN_CREATE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, ADMIN_CREATE_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        create(body, {
          onSuccess: ({ data: admin, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/admins/$adminId",
              params: { adminId: admin.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: ADMIN_CREATE_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.loginIdDuplicated]: "loginId",
              },
              onAlert: ({ message }) => errorToast.show(message),
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  return { fields, isSubmitting, handleSubmit };
}
