import { hotelListParamsSchema } from "@/shared/api";
import type { HotelPage } from "@/shared/api";

export const HOTEL_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - HOTEL_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return hotelListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, HOTEL_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: HotelPage) {
  return page > toApiPage(getLastPage(totalPages));
}
