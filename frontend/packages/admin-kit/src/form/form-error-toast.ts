import { useRef } from "react";
import { dismissToast, showToast } from "../toast";
import type { ToastId } from "../toast";

export function useFormErrorToast() {
  const toastIdRef = useRef<ToastId | undefined>(undefined);

  function dismiss() {
    if (toastIdRef.current === undefined) {
      return;
    }
    dismissToast(toastIdRef.current);
    toastIdRef.current = undefined;
  }

  function show(message: string) {
    dismiss();
    toastIdRef.current = showToast({ type: "error", message });
  }

  return { show, dismiss };
}
