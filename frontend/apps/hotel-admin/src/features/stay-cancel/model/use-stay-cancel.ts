import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { isStayCancelable } from "@/entities/stay";
import { getApiError } from "@/shared/api";
import type { Stay } from "@/shared/api";
import { getKoreanToday } from "@/shared/lib/date-time";
import { useCancelStay } from "../api/use-cancel-stay";
import {
  EMPTY_STAY_CANCEL_VALUES,
  STAY_CANCEL_FIELDS,
  stayCancelFormSchema,
} from "./stay-cancel-form-schema";

export type StayCancelStatus =
  | "unavailable"
  | "idle"
  | "editing"
  | "submitting";

type Phase = "idle" | "editing";

export function useStayCancel(stay: Stay) {
  const { cancel } = useCancelStay(stay);
  const errorToast = useFormErrorToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(stayCancelFormSchema),
    defaultValues: EMPTY_STAY_CANCEL_VALUES,
  });
  const fields = toFieldPropsMap(form, STAY_CANCEL_FIELDS);
  const status: StayCancelStatus = form.formState.isSubmitting
    ? "submitting"
    : isStayCancelable(stay, getKoreanToday())
      ? phase
      : "unavailable";

  function open() {
    if (status !== "idle") {
      return;
    }
    errorToast.dismiss();
    setPhase("editing");
  }

  function close() {
    if (status !== "editing") {
      return;
    }
    form.reset(EMPTY_STAY_CANCEL_VALUES);
    flushSync(() => setPhase("idle"));
    triggerRef.current?.focus();
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        cancel(body, {
          onSuccess: ({ message }) => {
            showToast({ type: "success", message });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: STAY_CANCEL_FIELDS,
              setError: form.setError,
              onAlert: ({ message }) => errorToast.show(message),
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

  return { status, fields, triggerRef, open, close, handleSubmit };
}
