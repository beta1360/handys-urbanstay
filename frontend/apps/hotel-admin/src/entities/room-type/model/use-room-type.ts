import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { RoomType } from "@/shared/api";
import { useRoomTypeQuery } from "../api/room-type-query";

export type RoomTypeState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; roomType: RoomType };

export function useRoomType(roomTypeId: number): RoomTypeState {
  const { data, error, refetch } = useRoomTypeQuery(roomTypeId);

  if (data !== undefined) {
    return { status: "ready", roomType: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.roomTypeNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
