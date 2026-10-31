import {
  memberListParamsSchema,
  memberStayListParamsSchema,
} from "@/shared/api";
import type { MemberPage } from "@/shared/api";

export const MEMBER_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - MEMBER_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return memberListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function isRequestableStayPage(page: number) {
  return memberStayListParamsSchema.shape.page.safeParse(toApiPage(page))
    .success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, MEMBER_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: MemberPage) {
  return page > toApiPage(getLastPage(totalPages));
}
