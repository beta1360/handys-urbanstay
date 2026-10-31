import {
  roomListParamsSchema,
  roomStatusHistoryParamsSchema,
} from "@/shared/api";
import type { RoomPage } from "@/shared/api";

export const ROOM_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - ROOM_LIST_FIRST_PAGE;
}

export function isRequestablePage(page: number) {
  return roomListParamsSchema.shape.page.safeParse(toApiPage(page)).success;
}

export function isRequestableStatusHistoryPage(page: number) {
  return roomStatusHistoryParamsSchema.shape.page.safeParse(toApiPage(page))
    .success;
}

export function getLastPage(totalPages: number) {
  return Math.max(totalPages, ROOM_LIST_FIRST_PAGE);
}

export function isBeyondLastPage({ page, totalPages }: RoomPage) {
  return page > toApiPage(getLastPage(totalPages));
}
