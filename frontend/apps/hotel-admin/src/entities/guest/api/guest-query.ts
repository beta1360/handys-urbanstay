import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchGuest, guestListQueryKey, guestQueryKey } from "@/shared/api";
import type { Guest } from "@/shared/api";

function guestQueryOptions(guestId: number) {
  return queryOptions({
    queryKey: guestQueryKey(guestId),
    queryFn: ({ signal }) => fetchGuest(guestId, { signal }),
  });
}

export function useGuestQuery(guestId: number) {
  return useQuery(guestQueryOptions(guestId));
}

export async function refetchGuest(queryClient: QueryClient, guestId: number) {
  const { queryKey } = guestQueryOptions(guestId);
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({
    ...guestQueryOptions(guestId),
    staleTime: 0,
  });
}

export function useRefetchGuest(guestId: number) {
  const queryClient = useQueryClient();
  return () => refetchGuest(queryClient, guestId);
}

export function cacheSavedGuest(queryClient: QueryClient, guest: Guest) {
  void queryClient.invalidateQueries({ queryKey: guestListQueryKey() });
  queryClient.setQueryData(guestQueryOptions(guest.id).queryKey, guest);
}
