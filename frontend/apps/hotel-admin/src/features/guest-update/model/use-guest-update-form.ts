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
  GUEST_INFO_FIELDS,
  GUEST_LOAD_MESSAGES,
  useRefetchGuest,
} from "@/entities/guest";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Guest } from "@/shared/api";
import { useUpdateGuest } from "../api/use-update-guest";
import {
  guestUpdateFormSchema,
  toGuestUpdateFormValues,
} from "./guest-update-form-schema";

export type GuestUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useGuestUpdateForm(guestId: number, initialGuest: Guest) {
  const { update } = useUpdateGuest(guestId);
  const refetchGuest = useRefetchGuest(guestId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(guestUpdateFormSchema),
    defaultValues: toGuestUpdateFormValues(initialGuest),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, GUEST_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.guestModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: GuestUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.guestModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
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
      const guest = await refetchGuest();
      form.reset(toGuestUpdateFormValues(guest), { keepFieldsRef: true });
      setLoadState("idle");
      form.setFocus(GUEST_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.guestNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: GUEST_LOAD_MESSAGES.loadFailed,
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
