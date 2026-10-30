import { hashKey, queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { fetchMe, meQueryKey } from "@/shared/api";
import type { Account } from "@/shared/api";

function meQueryOptions() {
  return queryOptions({
    queryKey: meQueryKey(),
    queryFn: ({ signal }) => fetchMe({ signal }),
  });
}

export function useMe() {
  return useQuery({ ...meQueryOptions(), refetchOnMount: false });
}

export function ensureMe(queryClient: QueryClient) {
  return queryClient.query({
    ...meQueryOptions(),
    staleTime: "static",
    retry: false,
  });
}

export function startSession(queryClient: QueryClient, account: Account) {
  queryClient.clear();
  queryClient.setQueryData(meQueryOptions().queryKey, account);
}

export function endSession(queryClient: QueryClient) {
  queryClient.clear();
}

export function isPendingMeQuery(
  queryClient: QueryClient,
  queryKey: QueryKey | undefined,
) {
  const meKey = meQueryOptions().queryKey;
  return (
    queryKey !== undefined &&
    hashKey(queryKey) === hashKey(meKey) &&
    queryClient.getQueryData(meKey) === undefined
  );
}

export function forgetMe(queryClient: QueryClient) {
  queryClient.removeQueries({
    queryKey: meQueryOptions().queryKey,
    exact: true,
  });
}
