import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Room } from "@/shared/api";
import { useRoomQuery } from "../api/room-query";

export type RoomState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; room: Room };

export function useRoom(roomId: number): RoomState {
  const { data, error, refetch } = useRoomQuery(roomId);

  if (data !== undefined) {
    return { status: "ready", room: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.roomNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
