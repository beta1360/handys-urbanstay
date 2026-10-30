import { z } from "zod";
import {
  HOTEL_LIST_FIRST_PAGE,
  isRequestablePage,
  normalizeHotelKeyword,
} from "@/entities/hotel";

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
    : HOTEL_LIST_FIRST_PAGE;
}

export const hotelListSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeHotelKeyword),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type HotelListSearch = z.output<typeof hotelListSearchSchema>;

export const HOTEL_LIST_DEFAULT_SEARCH = {
  page: HOTEL_LIST_FIRST_PAGE,
} as const;
