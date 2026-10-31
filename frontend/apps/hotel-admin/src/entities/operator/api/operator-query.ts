import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchOperator, operatorQueryKey } from "@/shared/api";

function operatorQueryOptions(operatorId: number) {
  return queryOptions({
    queryKey: operatorQueryKey(operatorId),
    queryFn: ({ signal }) => fetchOperator(operatorId, { signal }),
  });
}

export function useOperatorQuery(operatorId: number) {
  return useQuery(operatorQueryOptions(operatorId));
}
