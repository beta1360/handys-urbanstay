import { loadHotel } from "@/entities/hotel";
import { loadHotelRoom } from "@/entities/room";
import { ROUTES } from "@/shared/config";

export async function loadRoomBooking(
  hotelIdParam: string,
  roomIdParam: string,
) {
  const [hotel, room] = await Promise.all([
    loadHotel(hotelIdParam),
    loadHotelRoom(hotelIdParam, roomIdParam),
  ]);
  return {
    hotelName: hotel.name,
    room,
    roomListHref: ROUTES.hotelRooms(hotel.id),
  };
}
