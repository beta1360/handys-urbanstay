import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRooms, roomListQueryKey } from "@/shared/api";
import type { RoomListParams, RoomPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/room-page";

function roomListQueryOptions(params: RoomListParams) {
  return queryOptions({
    queryKey: roomListQueryKey(params),
    queryFn: ({ signal }) => fetchRooms(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: RoomPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useRoomListQuery(params: RoomListParams) {
  return useQuery({
    ...roomListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
