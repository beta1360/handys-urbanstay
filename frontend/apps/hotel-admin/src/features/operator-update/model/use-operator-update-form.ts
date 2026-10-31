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
  OPERATOR_INFO_FIELDS,
  OPERATOR_LOAD_MESSAGES,
  useRefetchOperator,
} from "@/entities/operator";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Operator } from "@/shared/api";
import { useUpdateOperator } from "../api/use-update-operator";
import {
  operatorUpdateFormSchema,
  toOperatorUpdateFormValues,
} from "./operator-update-form-schema";

export type OperatorUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useOperatorUpdateForm(
  operatorId: number,
  initialOperator: Operator,
) {
  const { update } = useUpdateOperator(operatorId);
  const refetchOperator = useRefetchOperator(operatorId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(operatorUpdateFormSchema),
    defaultValues: toOperatorUpdateFormValues(initialOperator),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, OPERATOR_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.operatorModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: OperatorUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.operatorModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
          onSuccess: ({ data: operator, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/operators/$operatorId",
              params: { operatorId: operator.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: OPERATOR_INFO_FIELDS,
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
      const operator = await refetchOperator();
      form.reset(toOperatorUpdateFormValues(operator), {
        keepFieldsRef: true,
      });
      setLoadState("idle");
      form.setFocus(OPERATOR_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.operatorNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: OPERATOR_LOAD_MESSAGES.loadFailed,
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
