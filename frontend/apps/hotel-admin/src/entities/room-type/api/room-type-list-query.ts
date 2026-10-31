import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRoomTypes, roomTypeListQueryKey } from "@/shared/api";

function roomTypeListQueryOptions() {
  return queryOptions({
    queryKey: roomTypeListQueryKey(),
    queryFn: ({ signal }) => fetchRoomTypes({ signal }),
  });
}

export function useRoomTypeListQuery() {
  return useQuery(roomTypeListQueryOptions());
}
