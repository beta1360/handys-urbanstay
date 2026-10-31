import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchStays, stayListQueryKey } from "@/shared/api";
import type { StayListParams, StayPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/stay-page";

function stayListQueryOptions(params: StayListParams) {
  return queryOptions({
    queryKey: stayListQueryKey(params),
    queryFn: ({ signal }) => fetchStays(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: StayPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useStayListQuery(params: StayListParams) {
  return useQuery({
    ...stayListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
