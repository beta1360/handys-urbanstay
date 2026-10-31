import type { LinkProps } from "@tanstack/react-router";
import { ADMIN_LAYOUT_MESSAGES } from "./messages";

export type AdminMenuItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  masterOnly?: boolean;
};

export const ADMIN_MENU_ITEMS: readonly AdminMenuItem[] = [
  { to: "/rooms", label: ADMIN_LAYOUT_MESSAGES.roomMenuLabel },
  {
    to: "/room-types",
    label: ADMIN_LAYOUT_MESSAGES.roomTypeMenuLabel,
    masterOnly: true,
  },
  { to: "/guests", label: ADMIN_LAYOUT_MESSAGES.guestMenuLabel },
  { to: "/stays", label: ADMIN_LAYOUT_MESSAGES.stayMenuLabel },
  {
    to: "/operators",
    label: ADMIN_LAYOUT_MESSAGES.operatorMenuLabel,
    masterOnly: true,
  },
  {
    to: "/hotel",
    label: ADMIN_LAYOUT_MESSAGES.hotelMenuLabel,
    masterOnly: true,
  },
  {
    to: "/settlements",
    label: ADMIN_LAYOUT_MESSAGES.settlementMenuLabel,
    masterOnly: true,
  },
];
