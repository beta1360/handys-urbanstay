import { hotelRoomListParamsSchema } from "@/shared/api";

export const ROOM_LIST_FIRST_PAGE = 1;

export function toApiPage(page: number) {
  return page - ROOM_LIST_FIRST_PAGE;
}

export function isRequestableRoomPage(page: number) {
  return hotelRoomListParamsSchema.shape.page.safeParse(toApiPage(page))
    .success;
}
