import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchSettlementStays, settlementStayListQueryKey } from "@/shared/api";
import type { SettlementStayListParams, SettlementStayPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/settlement-stay-page";

function settlementStayListQueryOptions(params: SettlementStayListParams) {
  return queryOptions({
    queryKey: settlementStayListQueryKey(params),
    queryFn: ({ signal }) => fetchSettlementStays(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: SettlementStayPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useSettlementStayListQuery(params: SettlementStayListParams) {
  return useQuery({
    ...settlementStayListQueryOptions(params),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1]?.month === params.month
        ? keepPreviousPageInRange(previousData)
        : undefined,
  });
}
