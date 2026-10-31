import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { createHotelMasterPasswordSchema } from "@/entities/hotel-master";
import { getApiError, resetHotelMasterPasswordBodySchema } from "@/shared/api";
import { useResetHotelMasterPassword } from "../api/use-reset-hotel-master-password";

const passwordResetFormSchema = resetHotelMasterPasswordBodySchema.extend({
  password: createHotelMasterPasswordSchema(
    resetHotelMasterPasswordBodySchema.shape.password,
  ),
});

const PASSWORD_RESET_FIELDS = ["password"] as const;

const EMPTY_PASSWORD_RESET_VALUES = { password: "" };

export type HotelMasterPasswordResetStatus = "editing" | "submitting";

export function useHotelMasterPasswordResetForm(hotelId: number) {
  const { reset } = useResetHotelMasterPassword(hotelId);
  const errorToast = useFormErrorToast();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: EMPTY_PASSWORD_RESET_VALUES,
  });
  const fields = toFieldPropsMap(form, PASSWORD_RESET_FIELDS);
  const status: HotelMasterPasswordResetStatus = form.formState.isSubmitting
    ? "submitting"
    : "editing";

  async function submit(event: FormEvent<HTMLFormElement>) {
    let succeeded = false;
    await form.handleSubmit(
      (body) =>
        new Promise<void>((resolve) => {
          reset(body, {
            onSuccess: ({ message }) => {
              showToast({ type: "success", message });
              succeeded = true;
              resolve();
            },
            onError: (error) => {
              showSubmitError(getApiError(error), {
                fields: PASSWORD_RESET_FIELDS,
                setError: form.setError,
                onAlert: ({ message }) => errorToast.show(message),
              });
              resolve();
            },
          });
        }),
    )(event);
    if (succeeded) {
      form.reset(EMPTY_PASSWORD_RESET_VALUES);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (status !== "editing") {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  return { fields, status, handleSubmit };
}
