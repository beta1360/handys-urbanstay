import { hotelRoomsParamsSchema, reservedPeriodsParamsSchema } from "@/shared/api";
import { parsePathId } from "@/shared/lib/path-param";

export function parseHotelId(value: string) {
  return parsePathId(value, hotelRoomsParamsSchema.shape.hotelId);
}

export function parseRoomId(value: string) {
  return parsePathId(value, reservedPeriodsParamsSchema.shape.roomId);
}
