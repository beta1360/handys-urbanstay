import type { ComponentProps, ReactNode } from "react";
import { joinClassNames } from "./class-names";

export function DescriptionList({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl
      {...props}
      className={joinClassNames(
        "divide-y divide-neutral-200 text-sm",
        className,
      )}
    />
  );
}

type DescriptionListItemProps = Omit<ComponentProps<"div">, "children"> & {
  term: ReactNode;
  children: ReactNode;
};

export function DescriptionListItem({
  term,
  children,
  className,
  ...props
}: DescriptionListItemProps) {
  return (
    <div
      {...props}
      className={joinClassNames(
        "grid grid-cols-[10rem_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0",
        className,
      )}
    >
      <dt className="font-medium text-neutral-600">{term}</dt>
      <dd className="whitespace-pre-line wrap-break-word text-neutral-900">
        {children}
      </dd>
    </div>
  );
}
