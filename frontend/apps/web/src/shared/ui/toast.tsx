import type { ReactNode } from "react";

export function ToastRegion({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto flex w-full max-w-md justify-center px-4"
    >
      {children}
    </div>
  );
}

export function ToastMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg wrap-break-word">
      {children}
    </p>
  );
}
