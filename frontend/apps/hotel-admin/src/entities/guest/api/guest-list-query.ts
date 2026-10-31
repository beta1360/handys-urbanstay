import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchGuests, guestListQueryKey } from "@/shared/api";
import type { GuestListParams, GuestPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/guest-page";

function guestListQueryOptions(params: GuestListParams) {
  return queryOptions({
    queryKey: guestListQueryKey(params),
    queryFn: ({ signal }) => fetchGuests(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: GuestPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useGuestListQuery(params: GuestListParams) {
  return useQuery({
    ...guestListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
