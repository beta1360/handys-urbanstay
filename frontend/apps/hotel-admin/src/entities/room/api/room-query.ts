import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRoom, roomQueryKey } from "@/shared/api";

function roomQueryOptions(roomId: number) {
  return queryOptions({
    queryKey: roomQueryKey(roomId),
    queryFn: ({ signal }) => fetchRoom(roomId, { signal }),
  });
}

export function useRoomQuery(roomId: number) {
  return useQuery(roomQueryOptions(roomId));
}
