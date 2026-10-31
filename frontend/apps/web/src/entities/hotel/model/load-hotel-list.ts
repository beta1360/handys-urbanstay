import type { Hotel } from "@/shared/api";
import { getHotelList } from "../api/hotel-list";

export type HotelListState =
  | { status: "empty" }
  | { status: "ready"; hotels: Hotel[] };

export async function loadHotelList(): Promise<HotelListState> {
  const { items } = await getHotelList();
  return items.length === 0
    ? { status: "empty" }
    : { status: "ready", hotels: items };
}
