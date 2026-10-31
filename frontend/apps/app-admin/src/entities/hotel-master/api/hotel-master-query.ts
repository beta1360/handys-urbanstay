import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchHotelMaster, hotelMasterQueryKey } from "@/shared/api";
import type { HotelMaster } from "@/shared/api";

function hotelMasterQueryOptions(hotelId: number) {
  return queryOptions({
    queryKey: hotelMasterQueryKey(hotelId),
    queryFn: ({ signal }) => fetchHotelMaster(hotelId, { signal }),
  });
}

export function useHotelMasterQuery(hotelId: number) {
  return useQuery(hotelMasterQueryOptions(hotelId));
}

export async function refetchHotelMaster(
  queryClient: QueryClient,
  hotelId: number,
) {
  const { queryKey } = hotelMasterQueryOptions(hotelId);
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({
    ...hotelMasterQueryOptions(hotelId),
    staleTime: 0,
  });
}

export function useRefetchHotelMaster(hotelId: number) {
  const queryClient = useQueryClient();
  return () => refetchHotelMaster(queryClient, hotelId);
}

export async function refreshHotelMaster(
  queryClient: QueryClient,
  hotelId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: hotelMasterQueryOptions(hotelId).queryKey,
  });
}

export function cacheSavedHotelMaster(
  queryClient: QueryClient,
  hotelId: number,
  master: HotelMaster,
) {
  queryClient.setQueryData(hotelMasterQueryOptions(hotelId).queryKey, master);
}
