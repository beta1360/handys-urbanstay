import type { z } from "zod";
import { createRoomTypeInfoFormShape } from "@/entities/room-type";
import { createRoomTypeBodySchema } from "@/shared/api";

export const roomTypeCreateFormSchema = createRoomTypeBodySchema.extend(
  createRoomTypeInfoFormShape(createRoomTypeBodySchema.shape),
);

type RoomTypeCreateFormValues = z.input<typeof roomTypeCreateFormSchema>;

export const EMPTY_ROOM_TYPE_CREATE_VALUES: RoomTypeCreateFormValues = {
  name: "",
  capacity: "",
  roomRate: "",
  checkInTime: "",
  checkOutTime: "",
};
