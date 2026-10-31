import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchRoom, roomListQueryKey, roomQueryKey } from "@/shared/api";
import type { Room } from "@/shared/api";

function roomQueryOptions(roomId: number) {
  return queryOptions({
    queryKey: roomQueryKey(roomId),
    queryFn: ({ signal }) => fetchRoom(roomId, { signal }),
  });
}

export function useRoomQuery(roomId: number) {
  return useQuery(roomQueryOptions(roomId));
}

export function cacheSavedRoom(queryClient: QueryClient, room: Room) {
  void queryClient.invalidateQueries({ queryKey: roomListQueryKey() });
  queryClient.setQueryData(roomQueryOptions(room.id).queryKey, room);
}
