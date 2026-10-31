import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchHotelMaster, hotelMasterQueryKey } from "@/shared/api";

function hotelMasterQueryOptions(hotelId: number) {
  return queryOptions({
    queryKey: hotelMasterQueryKey(hotelId),
    queryFn: ({ signal }) => fetchHotelMaster(hotelId, { signal }),
  });
}

export function useHotelMasterQuery(hotelId: number) {
  return useQuery(hotelMasterQueryOptions(hotelId));
}
