import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import {
  fetchRoomStatusHistories,
  roomStatusHistoriesQueryKey,
} from "@/shared/api";
import type { RoomStatusHistoryParams } from "@/shared/api";

function roomStatusHistoryQueryOptions(
  roomId: number,
  params: RoomStatusHistoryParams,
) {
  return queryOptions({
    queryKey: roomStatusHistoriesQueryKey(roomId, params),
    queryFn: ({ signal }) =>
      fetchRoomStatusHistories(roomId, params, { signal }),
  });
}

export function useRoomStatusHistoryQuery(
  roomId: number,
  params: RoomStatusHistoryParams,
) {
  return useQuery({
    ...roomStatusHistoryQueryOptions(roomId, params),
    placeholderData: keepPreviousData,
  });
}
