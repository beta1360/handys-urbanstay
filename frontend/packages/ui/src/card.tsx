import type { ComponentProps, ReactNode } from "react";
import { joinClassNames } from "./class-names";

type CardProps = ComponentProps<"div"> & {
  header?: ReactNode;
};

export function Card({ header, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={joinClassNames(
        "rounded-lg border border-neutral-200 bg-white",
        className,
      )}
    >
      {header ? (
        <div className="border-b border-neutral-200 px-6 py-4">{header}</div>
      ) : null}
      <div className="p-6">{children}</div>
    </div>
  );
}
