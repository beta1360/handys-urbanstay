import { stayListParamsSchema } from "@/shared/api";
import type { StayPage } from "@/shared/api";

export const STAY_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - STAY_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return stayListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, STAY_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: StayPage) {
  return page > toApiPage(getLastPage(totalPages));
}
