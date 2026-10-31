import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchOperators, operatorListQueryKey } from "@/shared/api";
import type { OperatorListParams, OperatorPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/operator-page";

function operatorListQueryOptions(params: OperatorListParams) {
  return queryOptions({
    queryKey: operatorListQueryKey(params),
    queryFn: ({ signal }) => fetchOperators(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: OperatorPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useOperatorListQuery(params: OperatorListParams) {
  return useQuery({
    ...operatorListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
