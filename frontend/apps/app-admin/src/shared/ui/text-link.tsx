import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";

const TEXT_LINK_CLASS_NAME =
  "rounded-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function TextAnchor({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      className={[TEXT_LINK_CLASS_NAME, className].filter(Boolean).join(" ")}
    />
  );
}

export const TextLink = createLink(TextAnchor);
