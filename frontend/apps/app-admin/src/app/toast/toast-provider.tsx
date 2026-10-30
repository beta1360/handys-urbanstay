import type { ReactNode } from "react";
import { Toast, ToastRegion } from "@repo/ui/toast";
import { TOAST_MESSAGES } from "@/shared/config";
import { dismissToast, useToasts } from "@/shared/lib/toast";

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useToasts();

  return (
    <>
      {children}
      <ToastRegion aria-label={TOAST_MESSAGES.regionLabel}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            closeLabel={TOAST_MESSAGES.close}
            onClose={() => dismissToast(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </ToastRegion>
    </>
  );
}
