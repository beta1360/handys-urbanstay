import { skipToken, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchHotelRoomTypes, roomTypesQueryKey } from "@/shared/api";
import type { RoomTypeListParams } from "@/shared/api";

const ROOM_TYPES_STALE_TIME_MS = 0;

export function useRoomTypesQuery(
  hotelId: number,
  params: RoomTypeListParams | undefined,
) {
  return useQuery({
    queryKey: roomTypesQueryKey(hotelId, params),
    queryFn:
      params === undefined
        ? skipToken
        : ({ signal }) => fetchHotelRoomTypes(hotelId, params, { signal }),
    staleTime: ROOM_TYPES_STALE_TIME_MS,
  });
}

export async function refreshRoomTypes(
  queryClient: QueryClient,
  hotelId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: roomTypesQueryKey(hotelId),
  });
}
