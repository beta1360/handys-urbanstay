import { loadHotelList } from "../model/load-hotel-list";
import { HotelListEmpty } from "./hotel-list-empty";
import { HotelListView } from "./hotel-list-view";

export async function HotelList() {
  const state = await loadHotelList();

  if (state.status === "empty") {
    return <HotelListEmpty />;
  }
  return <HotelListView hotels={state.hotels} />;
}
