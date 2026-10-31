const BUTTON_BASE_CLASS_NAME =
  "inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANT_CLASS_NAMES = {
  primary: "bg-gray-900 text-white not-disabled:hover:bg-gray-800",
  secondary:
    "border border-gray-200 bg-white text-gray-900 not-disabled:hover:bg-gray-50",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS_NAMES;

export function buttonClassName(variant: ButtonVariant) {
  return `${BUTTON_BASE_CLASS_NAME} ${BUTTON_VARIANT_CLASS_NAMES[variant]}`;
}
