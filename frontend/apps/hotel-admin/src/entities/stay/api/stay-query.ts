import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchStay, stayQueryKey } from "@/shared/api";

function stayQueryOptions(stayId: number) {
  return queryOptions({
    queryKey: stayQueryKey(stayId),
    queryFn: ({ signal }) => fetchStay(stayId, { signal }),
  });
}

export function useStayQuery(stayId: number) {
  return useQuery(stayQueryOptions(stayId));
}
