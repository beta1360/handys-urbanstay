import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  FORM_ALERT,
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import type { FormAlert } from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import {
  HOTEL_INFO_FIELDS,
  HOTEL_LOAD_MESSAGES,
  useRefetchHotel,
} from "@/entities/hotel";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { useUpdateHotel } from "../api/use-update-hotel";
import {
  hotelUpdateFormSchema,
  toHotelUpdateFormValues,
} from "./hotel-update-form-schema";

export type HotelUpdateStatus = "editing" | "submitting" | "reloading";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useHotelUpdateForm(initialHotel: Hotel) {
  const { update } = useUpdateHotel();
  const refetchHotel = useRefetchHotel();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(hotelUpdateFormSchema),
    defaultValues: toHotelUpdateFormValues(initialHotel),
  });
  const [isReloading, setIsReloading] = useState(false);
  const { formState } = form;
  const fields = toFieldPropsMap(form, HOTEL_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.hotelModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: HotelUpdateStatus = isReloading
    ? "reloading"
    : isSubmitting
      ? "submitting"
      : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.hotelModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
          onSuccess: ({ message }) => {
            showToast({ type: "success", message });
            void navigate({ to: "/hotel", replace: true });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: HOTEL_INFO_FIELDS,
              setError: form.setError,
              onAlert: toastFormAlert,
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (status !== "editing") {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  async function reload() {
    if (status !== "editing") {
      return;
    }
    setIsReloading(true);
    try {
      const hotel = await refetchHotel();
      form.reset(toHotelUpdateFormValues(hotel), { keepFieldsRef: true });
      setIsReloading(false);
      form.setFocus(HOTEL_INFO_FIELDS[0]);
    } catch {
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: HOTEL_LOAD_MESSAGES.loadFailed,
        });
        setIsReloading(false);
      });
      reloadButtonRef.current?.focus();
    }
  }

  return {
    fields,
    alert,
    status,
    reloadButtonRef,
    handleSubmit,
    reload: () => void reload(),
  };
}
