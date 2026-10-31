import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
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

export async function refetchOperator(
  queryClient: QueryClient,
  operatorId: number,
) {
  const { queryKey } = operatorQueryOptions(operatorId);
  await queryClient.cancelQueries({ queryKey });
  return queryClient.fetchQuery({
    ...operatorQueryOptions(operatorId),
    staleTime: 0,
  });
}

export function useRefetchOperator(operatorId: number) {
  const queryClient = useQueryClient();
  return () => refetchOperator(queryClient, operatorId);
}

export async function refreshOperator(
  queryClient: QueryClient,
  operatorId: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: operatorListQueryKey() }),
    queryClient.invalidateQueries({
      queryKey: operatorQueryOptions(operatorId).queryKey,
    }),
  ]);
}

export function cacheSavedOperator(
  queryClient: QueryClient,
  operator: Operator,
) {
  void queryClient.invalidateQueries({ queryKey: operatorListQueryKey() });
  queryClient.setQueryData(operatorQueryOptions(operator.id).queryKey, operator);
}
