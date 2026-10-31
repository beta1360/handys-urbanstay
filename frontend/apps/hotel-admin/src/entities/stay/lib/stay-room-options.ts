import type { Room, RoomPage } from "@/shared/api";

export const STAY_ROOM_OPTIONS_PARAMS = { page: 0, size: 100 } as const;

export function toStayRoomOptions(rooms: readonly Room[] | undefined) {
  return (rooms ?? []).map((room) => ({
    value: String(room.id),
    label: room.name,
  }));
}

export function isUnlistedStayRoom(
  roomPage: RoomPage | undefined,
  roomId: number,
) {
  return (
    roomPage !== undefined &&
    roomPage.items.length >= roomPage.totalElements &&
    !roomPage.items.some((room) => room.id === roomId)
  );
}
