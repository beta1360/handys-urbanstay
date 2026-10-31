import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { fetchStay, stayListQueryKey, stayQueryKey } from "@/shared/api";

function stayQueryOptions(stayId: number) {
  return queryOptions({
    queryKey: stayQueryKey(stayId),
    queryFn: ({ signal }) => fetchStay(stayId, { signal }),
  });
}

export function useStayQuery(stayId: number) {
  return useQuery(stayQueryOptions(stayId));
}

export async function refreshStay(queryClient: QueryClient, stayId: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stayListQueryKey() }),
    queryClient.invalidateQueries({
      queryKey: stayQueryOptions(stayId).queryKey,
    }),
  ]);
}
