import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";

const SIDEBAR_ITEM_CLASS_NAME =
  "*:flex *:h-9 *:items-center *:rounded-md *:px-3 *:text-sm *:text-neutral-600 *:hover:bg-neutral-100 *:hover:text-neutral-900 *:focus-visible:outline-2 *:focus-visible:-outline-offset-2 *:focus-visible:outline-neutral-900 *:aria-[current=page]:bg-neutral-100 *:aria-[current=page]:font-semibold *:aria-[current=page]:text-neutral-900";

type SidebarProps = ComponentProps<"nav"> & {
  "aria-label": string;
};

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <nav
      {...props}
      className={joinClassNames(
        "w-60 shrink-0 border-r border-neutral-200 bg-white p-3",
        className,
      )}
    >
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}

export function SidebarItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      {...props}
      className={joinClassNames(SIDEBAR_ITEM_CLASS_NAME, className)}
    />
  );
}
