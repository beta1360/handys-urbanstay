import type { ComponentProps } from "react";
import { buttonClassName } from "./button-class-name";
import type { ButtonVariant } from "./button-class-name";

type ButtonProps = Omit<ComponentProps<"button">, "className"> & {
  variant: ButtonVariant;
  loading?: boolean;
};

export function Button({
  variant,
  loading = false,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName(variant)}
    />
  );
}
