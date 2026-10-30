import { z } from "zod";
import { hotelListParamsSchema } from "@/shared/api";
import type { HotelPage } from "@/shared/api";

const { keyword: keywordParamSchema, page: pageParamSchema } =
  hotelListParamsSchema.shape;

const PAGE_NUMBER_PATTERN = /^\d+$/;

export const HOTEL_LIST_FIRST_PAGE = 1;

export const HOTEL_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeHotelKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}

function toApiPage(page: number) {
  return page - HOTEL_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return pageParamSchema.safeParse(toApiPage(page)).success;
}

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

export function toHotelListParams({ keyword, page }: HotelListSearch) {
  return { keyword, page: toApiPage(page) };
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, HOTEL_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: HotelPage) {
  return page > toApiPage(getLastPage(totalPages));
}
