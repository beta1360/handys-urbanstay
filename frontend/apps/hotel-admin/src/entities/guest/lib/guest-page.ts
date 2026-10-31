import { guestListParamsSchema } from "@/shared/api";
import type { GuestPage } from "@/shared/api";

export const GUEST_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - GUEST_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return guestListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, GUEST_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: GuestPage) {
  return page > toApiPage(getLastPage(totalPages));
}
