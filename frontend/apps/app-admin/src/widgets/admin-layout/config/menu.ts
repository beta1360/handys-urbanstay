import type { LinkProps } from "@tanstack/react-router";
import { ADMIN_LAYOUT_MESSAGES } from "./messages";

type AdminMenuItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
};

export const ADMIN_MENU_ITEMS: readonly AdminMenuItem[] = [
  { to: "/hotels", label: ADMIN_LAYOUT_MESSAGES.hotelMenuLabel },
];
