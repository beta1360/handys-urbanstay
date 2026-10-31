import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchGuest, guestQueryKey } from "@/shared/api";

function guestQueryOptions(guestId: number) {
  return queryOptions({
    queryKey: guestQueryKey(guestId),
    queryFn: ({ signal }) => fetchGuest(guestId, { signal }),
  });
}

export function useGuestQuery(guestId: number) {
  return useQuery(guestQueryOptions(guestId));
}
