import { adminListParamsSchema } from "@/shared/api";
import type { AdminPage } from "@/shared/api";

export const ADMIN_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - ADMIN_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return adminListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, ADMIN_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: AdminPage) {
  return page > toApiPage(getLastPage(totalPages));
}
