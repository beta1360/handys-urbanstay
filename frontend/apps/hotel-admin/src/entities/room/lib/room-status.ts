import { roomListParamsSchema } from "@/shared/api";

const statusParamSchema = roomListParamsSchema.shape.status.unwrap();

export const ROOM_STATUSES = statusParamSchema.options;

export function normalizeRoomStatus(value: string | undefined) {
  const result = statusParamSchema.safeParse(value);
  return result.success ? result.data : undefined;
}
