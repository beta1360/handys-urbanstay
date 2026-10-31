import { z } from "zod";
import {
  isRequestablePage,
  normalizeOperatorActive,
  normalizeOperatorKeyword,
  OPERATOR_LIST_FIRST_PAGE,
} from "@/entities/operator";

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
    : OPERATOR_LIST_FIRST_PAGE;
}

export const operatorListSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeOperatorKeyword),
  active: z
    .union([z.string(), z.boolean()])
    .optional()
    .catch(undefined)
    .transform(normalizeOperatorActive),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type OperatorListSearch = z.output<typeof operatorListSearchSchema>;

export const OPERATOR_LIST_DEFAULT_SEARCH = {
  page: OPERATOR_LIST_FIRST_PAGE,
} as const;
