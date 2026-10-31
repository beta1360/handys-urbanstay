"use client";

import type { ReactNode } from "react";
import { useToast } from "@/shared/lib/toast";
import { ToastMessage, ToastRegion } from "@/shared/ui";

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <>
      {children}
      <ToastRegion>
        {toast ? (
          <ToastMessage key={toast.id}>{toast.message}</ToastMessage>
        ) : null}
      </ToastRegion>
    </>
  );
}
