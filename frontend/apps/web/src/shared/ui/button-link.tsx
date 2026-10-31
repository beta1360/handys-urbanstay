import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassName } from "./button-class-name";
import type { ButtonVariant } from "./button-class-name";

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant: ButtonVariant;
};

export function ButtonLink({ variant, ...props }: ButtonLinkProps) {
  return <Link {...props} className={buttonClassName(variant)} />;
}
