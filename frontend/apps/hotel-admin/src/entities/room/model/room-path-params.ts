import { roomParamsSchema } from "@/shared/api";

const ROOM_ID_PATTERN = /^\d+$/;

const ROOM_ID_MIN = 1;

type RoomPathParams = {
  roomId: number | undefined;
};

function toRoomId(value: string) {
  if (!ROOM_ID_PATTERN.test(value)) {
    return undefined;
  }
  const roomId = Number(value);
  return roomId >= ROOM_ID_MIN && roomParamsSchema.safeParse({ roomId }).success
    ? roomId
    : undefined;
}

export function parseRoomPathParams(params: {
  roomId: string;
}): RoomPathParams {
  return { roomId: toRoomId(params.roomId) };
}

export function stringifyRoomPathParams({ roomId }: RoomPathParams) {
  return { roomId: String(roomId) };
}
