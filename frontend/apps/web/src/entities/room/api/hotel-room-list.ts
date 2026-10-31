import { fetchHotelRooms } from "@/shared/api";

const HOTEL_ROOM_LIST_PARAMS = { page: 0, size: 100 } as const;

export function getHotelRoomList(hotelId: number) {
  return fetchHotelRooms(hotelId, HOTEL_ROOM_LIST_PARAMS);
}
