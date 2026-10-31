import { z } from "zod";
import { ADMIN_LIST_FIRST_PAGE, isRequestablePage } from "@/entities/admin";

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
    : ADMIN_LIST_FIRST_PAGE;
}

export const adminListSearchSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export const ADMIN_LIST_DEFAULT_SEARCH = {
  page: ADMIN_LIST_FIRST_PAGE,
} as const;
