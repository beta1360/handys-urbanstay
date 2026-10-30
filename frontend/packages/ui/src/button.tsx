import type { ComponentProps } from "react";
import { buttonClassName } from "./button-class-name";
import type { ButtonVariant } from "./button-class-name";
import { joinClassNames } from "./class-names";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
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
      className={joinClassNames(buttonClassName(variant), className)}
    />
  );
}
