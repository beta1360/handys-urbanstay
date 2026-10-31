import type { RoomType, RoomTypeListParams } from "@/shared/api";
import { useRoomTypesQuery } from "../api/room-types-query";

export type RoomTypesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; roomTypes: RoomType[] };

export function useRoomTypes(
  hotelId: number,
  params: RoomTypeListParams | undefined,
): RoomTypesState {
  const { data, error, refetch } = useRoomTypesQuery(hotelId, params);

  if (params === undefined) {
    return { status: "idle" };
  }
  if (data !== undefined) {
    return data.length === 0
      ? { status: "empty" }
      : { status: "ready", roomTypes: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  return { status: "failed", retry: () => void refetch() };
}
