import { roomListParamsSchema } from "@/shared/api";

const ID_PATTERN = /^\d+$/;

const ID_MIN = 1;

const roomTypeIdParamSchema = roomListParamsSchema.shape.roomTypeId.unwrap();

export function normalizeRoomTypeFilterId(value: string | number | undefined) {
  const id =
    typeof value === "string" && ID_PATTERN.test(value) ? Number(value) : value;
  return typeof id === "number" &&
    id >= ID_MIN &&
    roomTypeIdParamSchema.safeParse(id).success
    ? id
    : undefined;
}
