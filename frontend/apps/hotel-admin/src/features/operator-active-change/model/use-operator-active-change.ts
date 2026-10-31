import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FORM_ALERT_MESSAGES } from "@repo/admin-kit/config";
import { useFormErrorToast } from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Operator } from "@/shared/api";
import { useChangeOperatorActive } from "../api/use-change-operator-active";

export type OperatorActiveChangeStatus = "idle" | "confirming" | "changing";

export type OperatorActiveChangeAction = "deactivate" | "activate";

type Phase = "idle" | "confirming";

export function useOperatorActiveChange(operator: Operator) {
  const { change, isPending } = useChangeOperatorActive(operator.id);
  const errorToast = useFormErrorToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const status: OperatorActiveChangeStatus = isPending ? "changing" : phase;
  const action: OperatorActiveChangeAction = operator.active
    ? "deactivate"
    : "activate";

  function finish() {
    flushSync(() => setPhase("idle"));
    triggerRef.current?.focus();
  }

  function request() {
    if (status !== "idle") {
      return;
    }
    errorToast.dismiss();
    setPhase("confirming");
  }

  function cancel() {
    if (status !== "confirming") {
      return;
    }
    finish();
  }

  function confirm() {
    if (status !== "confirming") {
      return;
    }
    change(
      { active: !operator.active },
      {
        onSuccess: ({ message }) => {
          showToast({ type: "success", message });
          finish();
        },
        onError: (error) => {
          const apiError = getApiError(error);
          if (apiError?.code !== API_ERROR_CODES.unauthorized) {
            errorToast.show(
              apiError?.message ?? FORM_ALERT_MESSAGES.requestFailed,
            );
          }
          finish();
        },
      },
    );
  }

  return { status, action, triggerRef, request, cancel, confirm };
}
