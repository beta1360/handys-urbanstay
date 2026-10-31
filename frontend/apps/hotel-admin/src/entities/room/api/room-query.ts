import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  fetchRoom,
  isRoomQueryKey,
  roomListQueryKey,
  roomQueryKey,
  roomStatusHistoriesQueryKey,
} from "@/shared/api";
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

export async function refetchRoom(queryClient: QueryClient, roomId: number) {
  const { queryKey } = roomQueryOptions(roomId);
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({ ...roomQueryOptions(roomId), staleTime: 0 });
}

export function useRefetchRoom(roomId: number) {
  const queryClient = useQueryClient();
  return () => refetchRoom(queryClient, roomId);
}

export function cacheSavedRoom(queryClient: QueryClient, room: Room) {
  void queryClient.invalidateQueries({ queryKey: roomListQueryKey() });
  queryClient.setQueryData(roomQueryOptions(room.id).queryKey, room);
}

export async function invalidateRooms(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: roomListQueryKey() }),
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => isRoomQueryKey(queryKey),
    }),
  ]);
}

export async function refreshRoomStatus(
  queryClient: QueryClient,
  roomId: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: roomListQueryKey() }),
    queryClient.invalidateQueries({
      queryKey: roomQueryOptions(roomId).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: roomStatusHistoriesQueryKey(roomId),
    }),
  ]);
}
