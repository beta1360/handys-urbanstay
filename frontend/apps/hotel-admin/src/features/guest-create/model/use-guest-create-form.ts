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
import { GUEST_INFO_FIELDS } from "@/entities/guest";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useCreateGuest } from "../api/use-create-guest";
import {
  EMPTY_GUEST_CREATE_VALUES,
  guestCreateFormSchema,
} from "./guest-create-form-schema";

export function useGuestCreateForm() {
  const { create } = useCreateGuest();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(guestCreateFormSchema),
    defaultValues: EMPTY_GUEST_CREATE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, GUEST_INFO_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        create(body, {
          onSuccess: ({ data: guest, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/guests/$guestId",
              params: { guestId: guest.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: GUEST_INFO_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.guestPhoneDuplicated]: "phone",
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
