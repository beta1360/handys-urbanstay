import type { LinkProps } from "@tanstack/react-router";
import { ADMIN_LAYOUT_MESSAGES } from "./messages";

export type AdminMenuItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  masterOnly?: boolean;
};

export const ADMIN_MENU_ITEMS: readonly AdminMenuItem[] = [
  { to: "/rooms", label: ADMIN_LAYOUT_MESSAGES.roomMenuLabel },
  { to: "/guests", label: ADMIN_LAYOUT_MESSAGES.guestMenuLabel },
  {
    to: "/operators",
    label: ADMIN_LAYOUT_MESSAGES.operatorMenuLabel,
    masterOnly: true,
  },
];
