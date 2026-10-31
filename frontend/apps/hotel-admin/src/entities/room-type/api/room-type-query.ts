import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  fetchRoomType,
  roomTypeListQueryKey,
  roomTypeQueryKey,
} from "@/shared/api";
import type { RoomType } from "@/shared/api";

function roomTypeQueryOptions(roomTypeId: number) {
  return queryOptions({
    queryKey: roomTypeQueryKey(roomTypeId),
    queryFn: ({ signal }) => fetchRoomType(roomTypeId, { signal }),
  });
}

export function useRoomTypeQuery(roomTypeId: number) {
  return useQuery(roomTypeQueryOptions(roomTypeId));
}

export async function refetchRoomType(
  queryClient: QueryClient,
  roomTypeId: number,
) {
  const { queryKey } = roomTypeQueryOptions(roomTypeId);
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({
    ...roomTypeQueryOptions(roomTypeId),
    staleTime: 0,
  });
}

export function useRefetchRoomType(roomTypeId: number) {
  const queryClient = useQueryClient();
  return () => refetchRoomType(queryClient, roomTypeId);
}

export function cacheSavedRoomType(
  queryClient: QueryClient,
  roomType: RoomType,
) {
  void queryClient.invalidateQueries({ queryKey: roomTypeListQueryKey() });
  queryClient.setQueryData(
    roomTypeQueryOptions(roomType.id).queryKey,
    roomType,
  );
}
