import { loadHotelRooms } from "../model/load-hotel-rooms";
import { RoomListEmpty } from "./room-list-empty";
import { RoomListView } from "./room-list-view";

type HotelRoomListProps = {
  hotelId: string;
};

export async function HotelRoomList({ hotelId }: HotelRoomListProps) {
  const state = await loadHotelRooms(hotelId);

  if (state.status === "empty") {
    return <RoomListEmpty />;
  }
  return <RoomListView hotelId={state.hotelId} rooms={state.rooms} />;
}
