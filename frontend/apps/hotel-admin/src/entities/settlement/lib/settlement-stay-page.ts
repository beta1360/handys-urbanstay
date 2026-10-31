import { settlementStayListParamsSchema } from "@/shared/api";
import type { SettlementStayPage } from "@/shared/api";

export const SETTLEMENT_STAY_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - SETTLEMENT_STAY_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return settlementStayListParamsSchema.shape.page.safeParse(toApiPage(page))
    .success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, SETTLEMENT_STAY_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: SettlementStayPage) {
  return page > toApiPage(getLastPage(totalPages));
}
