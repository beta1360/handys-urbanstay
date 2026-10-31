import Link from "next/link";
import type { ComponentProps } from "react";

type TextLinkProps = Omit<ComponentProps<typeof Link>, "className">;

export function TextLink(props: TextLinkProps) {
  return (
    <Link
      {...props}
      className="self-start text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
    />
  );
}
