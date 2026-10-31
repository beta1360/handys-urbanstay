import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchRoomReservedPeriods, reservedPeriodsQueryKey } from "@/shared/api";

const RESERVED_PERIOD_LIST_PARAMS = { page: 0, size: 100 } as const;

function reservedPeriodsQueryOptions(roomId: number) {
  return queryOptions({
    queryKey: reservedPeriodsQueryKey(roomId, RESERVED_PERIOD_LIST_PARAMS),
    queryFn: ({ signal }) =>
      fetchRoomReservedPeriods(roomId, RESERVED_PERIOD_LIST_PARAMS, { signal }),
  });
}

export function useReservedPeriodsQuery(roomId: number) {
  return useQuery(reservedPeriodsQueryOptions(roomId));
}

export async function refreshReservedPeriods(
  queryClient: QueryClient,
  roomId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: reservedPeriodsQueryKey(roomId),
  });
}
