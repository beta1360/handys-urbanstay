import type { ReactNode } from "react";
import { QueryProvider } from "../query/query-provider";
import { ToastProvider } from "../toast/toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>{children}</ToastProvider>
    </QueryProvider>
  );
}
