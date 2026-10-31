import { loadHotel } from "@/entities/hotel";

export async function loadHotelBooking(hotelIdParam: string) {
  const hotel = await loadHotel(hotelIdParam);
  return { hotelId: hotel.id, hotelName: hotel.name };
}
