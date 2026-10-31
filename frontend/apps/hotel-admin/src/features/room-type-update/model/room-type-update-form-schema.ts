import type { z } from "zod";
import { createRoomTypeInfoFormShape } from "@/entities/room-type";
import { updateRoomTypeBodySchema } from "@/shared/api";
import type { RoomType } from "@/shared/api";

export const roomTypeUpdateFormSchema = updateRoomTypeBodySchema.extend(
  createRoomTypeInfoFormShape(updateRoomTypeBodySchema.shape),
);

type RoomTypeUpdateFormValues = z.input<typeof roomTypeUpdateFormSchema>;

export function toRoomTypeUpdateFormValues(
  roomType: RoomType,
): RoomTypeUpdateFormValues {
  return {
    name: roomType.name,
    capacity: String(roomType.capacity),
    roomRate: String(roomType.roomRate),
    checkInTime: roomType.checkInTime,
    checkOutTime: roomType.checkOutTime,
    version: roomType.version,
  };
}
