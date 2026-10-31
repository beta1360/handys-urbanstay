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
  HOTEL_MASTER_INFO_FIELDS,
  HOTEL_MASTER_LOAD_MESSAGES,
  useRefetchHotelMaster,
} from "@/entities/hotel-master";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { HotelMaster } from "@/shared/api";
import { useUpdateHotelMaster } from "../api/use-update-hotel-master";
import {
  hotelMasterUpdateFormSchema,
  toHotelMasterUpdateFormValues,
} from "./hotel-master-update-form-schema";

export type HotelMasterUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useHotelMasterUpdateForm(
  hotelId: number,
  initialMaster: HotelMaster,
) {
  const { update } = useUpdateHotelMaster(hotelId);
  const refetchHotelMaster = useRefetchHotelMaster(hotelId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(hotelMasterUpdateFormSchema),
    defaultValues: toHotelMasterUpdateFormValues(initialMaster),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, HOTEL_MASTER_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.hotelAdminModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: HotelMasterUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.hotelAdminModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
          onSuccess: ({ message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/hotels/$hotelId",
              params: { hotelId },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: HOTEL_MASTER_INFO_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.loginIdDuplicated]: "loginId",
              },
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
    setLoadState("reloading");
    try {
      const master = await refetchHotelMaster();
      form.reset(toHotelMasterUpdateFormValues(master), {
        keepFieldsRef: true,
      });
      setLoadState("idle");
      form.setFocus(HOTEL_MASTER_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: HOTEL_MASTER_LOAD_MESSAGES.loadFailed,
        });
        setLoadState("idle");
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
