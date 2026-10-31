import { roomListParamsSchema } from "@/shared/api";
import type { RoomStatus } from "@/shared/api";

const statusParamSchema = roomListParamsSchema.shape.status.unwrap();

export const ROOM_STATUSES = statusParamSchema.options;

export const ROOM_STATUS_TRANSITIONS = {
  VACANT: ["RESERVED", "MAINTENANCE"],
  RESERVED: ["OCCUPIED", "VACANT"],
  OCCUPIED: ["MAINTENANCE"],
  MAINTENANCE: ["VACANT"],
} as const satisfies Record<RoomStatus, readonly RoomStatus[]>;

export function normalizeRoomStatus(value: string | undefined) {
  const result = statusParamSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
