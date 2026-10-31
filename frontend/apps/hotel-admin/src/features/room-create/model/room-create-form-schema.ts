import type { z } from "zod";
import { createRoomInfoFormShape } from "@/entities/room";
import { createRoomBodySchema } from "@/shared/api";

export const roomCreateFormSchema = createRoomBodySchema.extend(
  createRoomInfoFormShape(createRoomBodySchema.shape),
);

type RoomCreateFormValues = z.input<typeof roomCreateFormSchema>;

export const EMPTY_ROOM_CREATE_VALUES: RoomCreateFormValues = {
  name: "",
  type: "",
  capacity: "",
  floor: "",
  checkInTime: "",
  checkOutTime: "",
  description: "",
};
