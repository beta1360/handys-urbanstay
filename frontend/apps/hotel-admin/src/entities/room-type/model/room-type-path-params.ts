import { roomTypeParamsSchema } from "@/shared/api";

const ROOM_TYPE_ID_PATTERN = /^\d+$/;

const ROOM_TYPE_ID_MIN = 1;

type RoomTypePathParams = {
  roomTypeId: number | undefined;
};

function toRoomTypeId(value: string) {
  if (!ROOM_TYPE_ID_PATTERN.test(value)) {
    return undefined;
  }
  const roomTypeId = Number(value);
  return roomTypeId >= ROOM_TYPE_ID_MIN &&
    roomTypeParamsSchema.safeParse({ roomTypeId }).success
    ? roomTypeId
    : undefined;
}

export function parseRoomTypePathParams(params: {
  roomTypeId: string;
}): RoomTypePathParams {
  return { roomTypeId: toRoomTypeId(params.roomTypeId) };
}

export function stringifyRoomTypePathParams({
  roomTypeId,
}: RoomTypePathParams) {
  return { roomTypeId: String(roomTypeId) };
}
