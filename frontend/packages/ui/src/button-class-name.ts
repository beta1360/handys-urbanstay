import { joinClassNames } from "./class-names";

const BUTTON_BASE_CLASS_NAME =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "bg-neutral-900 text-white not-disabled:hover:bg-neutral-800",
  secondary:
    "border border-neutral-200 bg-white text-neutral-900 not-disabled:hover:bg-neutral-50",
  ghost: "text-neutral-900 not-disabled:hover:bg-neutral-100",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS_NAMES;

export function buttonClassName(variant: ButtonVariant = "primary") {
  return joinClassNames(
    BUTTON_BASE_CLASS_NAME,
    BUTTON_VARIANT_CLASS_NAMES[variant],
  );
}
