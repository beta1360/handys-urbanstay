import { z } from "zod";
import {
  isRequestablePage,
  normalizeSettlementMonth,
  SETTLEMENT_STAY_LIST_FIRST_PAGE,
} from "@/entities/settlement";

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
    : SETTLEMENT_STAY_LIST_FIRST_PAGE;
}

export const settlementSearchSchema = z.object({
  month: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeSettlementMonth),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type SettlementSearch = z.output<typeof settlementSearchSchema>;

export const SETTLEMENT_DEFAULT_SEARCH = {
  page: SETTLEMENT_STAY_LIST_FIRST_PAGE,
} as const;
