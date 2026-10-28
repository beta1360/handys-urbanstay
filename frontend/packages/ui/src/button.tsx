import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";

const BUTTON_BASE_CLASS_NAME =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "bg-neutral-900 text-white enabled:hover:bg-neutral-800",
  secondary:
    "border border-neutral-200 bg-white text-neutral-900 enabled:hover:bg-neutral-50",
  ghost: "text-neutral-900 enabled:hover:bg-neutral-100",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof BUTTON_VARIANT_CLASS_NAMES;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={joinClassNames(
        BUTTON_BASE_CLASS_NAME,
        BUTTON_VARIANT_CLASS_NAMES[variant],
        className,
      )}
    />
  );
}
