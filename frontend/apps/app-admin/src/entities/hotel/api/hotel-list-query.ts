import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchHotels, hotelListQueryKey } from "@/shared/api";
import type { HotelListParams, HotelPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/hotel-page";

function hotelListQueryOptions(params: HotelListParams) {
  return queryOptions({
    queryKey: hotelListQueryKey(params),
    queryFn: ({ signal }) => fetchHotels(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: HotelPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useHotelListQuery(params: HotelListParams) {
  return useQuery({
    ...hotelListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
