import type { ReactNode } from "react";
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
      {children}
    </nav>
  );
}
