import { z } from "zod";
import {
  isRequestablePage,
  normalizeStayCanceled,
  normalizeStayFilterId,
  STAY_LIST_FIRST_PAGE,
} from "@/entities/stay";

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
    : STAY_LIST_FIRST_PAGE;
}

const filterIdSchema = z
  .union([z.string(), z.number()])
  .optional()
  .catch(undefined)
  .transform(normalizeStayFilterId);

export const stayListSearchSchema = z.object({
  roomId: filterIdSchema,
  guestId: filterIdSchema,
  canceled: z
    .union([z.string(), z.boolean()])
    .optional()
    .catch(undefined)
    .transform(normalizeStayCanceled),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type StayListSearch = z.output<typeof stayListSearchSchema>;

export const STAY_LIST_DEFAULT_SEARCH = {
  page: STAY_LIST_FIRST_PAGE,
} as const;
