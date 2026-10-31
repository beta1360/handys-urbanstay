import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  fetchOperator,
  operatorListQueryKey,
  operatorQueryKey,
} from "@/shared/api";
import type { Operator } from "@/shared/api";

function operatorQueryOptions(operatorId: number) {
  return queryOptions({
    queryKey: operatorQueryKey(operatorId),
    queryFn: ({ signal }) => fetchOperator(operatorId, { signal }),
  });
}

export function useOperatorQuery(operatorId: number) {
  return useQuery(operatorQueryOptions(operatorId));
}

export function cacheSavedOperator(
  queryClient: QueryClient,
  operator: Operator,
) {
  void queryClient.invalidateQueries({ queryKey: operatorListQueryKey() });
  queryClient.setQueryData(operatorQueryOptions(operator.id).queryKey, operator);
}
