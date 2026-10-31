import { notFound } from "next/navigation";
import { hotelIdParamsSchema } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { parsePathId } from "@/shared/lib/path-param";
import { findHotel } from "../api/hotel-list";

export async function loadHotel(hotelIdParam: string): Promise<Hotel> {
  const hotelId = parsePathId(
    hotelIdParam,
    hotelIdParamsSchema.shape.hotelId,
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
