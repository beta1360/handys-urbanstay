import { useRoomTypeListQuery } from "@/entities/room-type";
import type { RoomType } from "@/shared/api";

export type RoomTypeListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; roomTypes: readonly RoomType[] };

export function useRoomTypeList(): RoomTypeListState {
  const { data, isError, refetch } = useRoomTypeListQuery();

  if (data === undefined) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.length === 0) {
    return { status: "empty" };
  }
  return { status: "ready", roomTypes: data };
}
