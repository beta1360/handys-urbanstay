import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchHotel, hotelQueryKey } from "@/shared/api";
import type { Hotel } from "@/shared/api";

function hotelQueryOptions() {
  return queryOptions({
    queryKey: hotelQueryKey(),
    queryFn: ({ signal }) => fetchHotel({ signal }),
  });
}

export function useHotelQuery() {
  return useQuery(hotelQueryOptions());
}

export async function refetchHotel(queryClient: QueryClient) {
  const { queryKey } = hotelQueryOptions();
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({ ...hotelQueryOptions(), staleTime: 0 });
}

export function useRefetchHotel() {
  const queryClient = useQueryClient();
  return () => refetchHotel(queryClient);
}

export function cacheSavedHotel(queryClient: QueryClient, hotel: Hotel) {
  queryClient.setQueryData(hotelQueryOptions().queryKey, hotel);
}
