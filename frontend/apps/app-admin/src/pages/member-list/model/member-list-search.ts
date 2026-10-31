import { z } from "zod";
import {
  isRequestablePage,
  MEMBER_LIST_FIRST_PAGE,
  normalizeMemberKeyword,
} from "@/entities/member";

const PAGE_NUMBER_PATTERN = /^\d+$/;

function toPageNumber(value: string | number | undefined) {
  if (typeof value === "string") {
    return PAGE_NUMBER_PATTERN.test(value) ? Number(value) : undefined;
  }
  return value;
}

function normalizePage(value: string | number | undefined) {
  const page = toPageNumber(value);
  return page !== undefined && isRequestablePage(page)
    ? page
    : MEMBER_LIST_FIRST_PAGE;
}

export const memberListSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeMemberKeyword),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export const MEMBER_LIST_DEFAULT_SEARCH = {
  page: MEMBER_LIST_FIRST_PAGE,
} as const;
