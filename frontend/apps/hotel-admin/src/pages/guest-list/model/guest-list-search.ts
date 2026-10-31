import { z } from "zod";
import {
  GUEST_LIST_FIRST_PAGE,
  isRequestablePage,
  normalizeGuestKeyword,
} from "@/entities/guest";

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
    : GUEST_LIST_FIRST_PAGE;
}

export const guestListSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeGuestKeyword),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type GuestListSearch = z.output<typeof guestListSearchSchema>;

export const GUEST_LIST_DEFAULT_SEARCH = {
  page: GUEST_LIST_FIRST_PAGE,
} as const;
