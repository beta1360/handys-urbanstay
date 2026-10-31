import { operatorListParamsSchema } from "@/shared/api";
import type { OperatorPage } from "@/shared/api";

export const OPERATOR_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - OPERATOR_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return operatorListParamsSchema.shape.page.safeParse(toApiPage(page))
    .success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, OPERATOR_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: OperatorPage) {
  return page > toApiPage(getLastPage(totalPages));
}
