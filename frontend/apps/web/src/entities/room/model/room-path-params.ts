import { hotelRoomsParamsSchema } from "@/shared/api";
import { parsePathId } from "@/shared/lib/path-param";

export function parseHotelId(value: string) {
  return parsePathId(value, hotelRoomsParamsSchema.shape.hotelId);
}
