import { buttonClassName } from "@repo/ui/button-class-name";
import type { ButtonVariant } from "@repo/ui/button-class-name";
import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type ButtonAnchorProps = ComponentProps<"a"> & {
  variant?: ButtonVariant;
};

function ButtonAnchor({ variant, className, ...props }: ButtonAnchorProps) {
  return (
    <a
      {...props}
      className={[buttonClassName(variant), className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export const ButtonLink = createLink(ButtonAnchor);
