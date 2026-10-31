import { fetchHotels } from "@/shared/api";

const HOTEL_LIST_PARAMS = { page: 0, size: 100 } as const;

export function getHotelList() {
  return fetchHotels(HOTEL_LIST_PARAMS);
}
