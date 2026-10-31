import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchSettlement, settlementQueryKey } from "@/shared/api";

function settlementQueryOptions(month: string) {
  const params = { month };
  return queryOptions({
    queryKey: settlementQueryKey(params),
    queryFn: ({ signal }) => fetchSettlement(params, { signal }),
  });
}

export function useSettlementQuery(month: string) {
  return useQuery(settlementQueryOptions(month));
}
