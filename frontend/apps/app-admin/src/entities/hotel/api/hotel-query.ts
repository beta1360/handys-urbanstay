import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchHotel, hotelListQueryKey, hotelQueryKey } from "@/shared/api";
import type { Hotel } from "@/shared/api";

function hotelQueryOptions(hotelId: number) {
  return queryOptions({
    queryKey: hotelQueryKey(hotelId),
    queryFn: ({ signal }) => fetchHotel(hotelId, { signal }),
  });
}

export function useHotelQuery(hotelId: number) {
  return useQuery(hotelQueryOptions(hotelId));
}

export async function refetchHotel(queryClient: QueryClient, hotelId: number) {
  const { queryKey } = hotelQueryOptions(hotelId);
  // 진행 중인 조회가 있으면 fetchQuery가 그 결과를 함께 쓰므로 취소한 뒤 새로 조회한다.
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({
    ...hotelQueryOptions(hotelId),
    staleTime: 0,
  });
}

export function useRefetchHotel(hotelId: number) {
  const queryClient = useQueryClient();
  return () => refetchHotel(queryClient, hotelId);
}

export function cacheSavedHotel(queryClient: QueryClient, hotel: Hotel) {
  void queryClient.invalidateQueries({ queryKey: hotelListQueryKey() });
  queryClient.setQueryData(hotelQueryOptions(hotel.id).queryKey, hotel);
}
