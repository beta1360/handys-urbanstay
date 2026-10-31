import Link from "next/link";
import type { ReactNode } from "react";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { APP_HEADER_MESSAGES } from "../config/messages";

type HeaderMemberMenuProps = {
  name: string;
  children: ReactNode;
};

export function HeaderMemberMenu({ name, children }: HeaderMemberMenuProps) {
  return (
    <nav className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-900">
        {APP_HEADER_MESSAGES.memberName(name)}
      </span>
      <Link
        href={ROUTES.myStays}
        className="text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      >
        {COMMON_MESSAGES.myStays}
      </Link>
      {children}
    </nav>
  );
}
