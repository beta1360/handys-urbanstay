import { notFound } from "next/navigation";
import { hotelRoomsParamsSchema } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { parsePathId } from "@/shared/lib/path-param";
import { findHotel } from "../api/hotel-list";

export async function loadHotel(hotelIdParam: string): Promise<Hotel> {
  const hotelId = parsePathId(
    hotelIdParam,
    hotelRoomsParamsSchema.shape.hotelId,
  );
  if (hotelId === undefined) {
    notFound();
  }
  const hotel = await findHotel(hotelId);
  if (hotel === undefined) {
    notFound();
  }
  return hotel;
}
