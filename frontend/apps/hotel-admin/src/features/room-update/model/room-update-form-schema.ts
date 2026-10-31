import type { z } from "zod";
import { createRoomInfoFormShape } from "@/entities/room";
import { updateRoomBodySchema } from "@/shared/api";
import type { Room } from "@/shared/api";

export const roomUpdateFormSchema = updateRoomBodySchema.extend(
  createRoomInfoFormShape(updateRoomBodySchema.shape),
);

type RoomUpdateFormValues = z.input<typeof roomUpdateFormSchema>;

export function toRoomUpdateFormValues(room: Room): RoomUpdateFormValues {
  return {
    name: room.name,
    type: room.type,
    capacity: String(room.capacity),
    floor: room.floor === null ? "" : String(room.floor),
    checkInTime: room.checkInTime,
    checkOutTime: room.checkOutTime,
    description: room.description ?? "",
    version: room.version,
  };
}
