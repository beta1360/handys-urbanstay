import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { fetchHotelRooms, hotelRoomListQueryKey } from "@/shared/api";
import type { HotelRoomListParams } from "@/shared/api";

function hotelRoomListQueryOptions(
  hotelId: number,
  params: HotelRoomListParams,
) {
  return queryOptions({
    queryKey: hotelRoomListQueryKey(hotelId, params),
    queryFn: ({ signal }) => fetchHotelRooms(hotelId, params, { signal }),
  });
}

export function useHotelRoomListQuery(
  hotelId: number,
  params: HotelRoomListParams,
) {
  return useQuery({
    ...hotelRoomListQueryOptions(hotelId, params),
    placeholderData: keepPreviousData,
  });
}
