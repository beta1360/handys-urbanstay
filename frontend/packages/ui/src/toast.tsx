import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";

export type ToastType = "success" | "error";

const TOAST_ROLES = {
  success: "status",
  error: "alert",
} as const;

const TOAST_MESSAGE_CLASS_NAMES = {
  success: "text-neutral-900",
  error: "text-red-600",
} as const;

type ToastRegionProps = ComponentProps<"section"> & {
  "aria-label": string;
};

export function ToastRegion({ className, ...props }: ToastRegionProps) {
  return (
    <section
      {...props}
      className={joinClassNames(
        "fixed top-4 right-4 z-50 flex w-80 flex-col gap-2",
        className,
      )}
    />
  );
}

type ToastProps = Omit<ComponentProps<"div">, "role"> & {
  type: ToastType;
  closeLabel: string;
  onClose: () => void;
};

export function Toast({
  type,
  closeLabel,
  onClose,
  className,
  children,
  ...props
}: ToastProps) {
  return (
    <div
      {...props}
      role={TOAST_ROLES[type]}
      className={joinClassNames(
        "flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg",
        className,
      )}
    >
      <p
        className={joinClassNames(
          "min-w-0 flex-1 text-sm wrap-break-word",
          TOAST_MESSAGE_CLASS_NAMES[type],
        )}
      >
        {children}
      </p>
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-900"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
