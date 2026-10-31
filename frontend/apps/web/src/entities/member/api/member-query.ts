import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  API_ERROR_CODES,
  fetchMe,
  getApiError,
  memberQueryKey,
} from "@/shared/api";
import type { Member } from "@/shared/api";

async function fetchMemberOrNull(signal: AbortSignal): Promise<Member | null> {
  try {
    return await fetchMe({ signal });
  } catch (error) {
    if (getApiError(error)?.code === API_ERROR_CODES.unauthorized) {
      return null;
    }
    throw error;
  }
}

function memberQueryOptions() {
  return queryOptions({
    queryKey: memberQueryKey(),
    queryFn: ({ signal }) => fetchMemberOrNull(signal),
  });
}

export function useMemberQuery() {
  return useQuery(memberQueryOptions());
}

export function startMemberSession(queryClient: QueryClient, member: Member) {
  queryClient.setQueryData(memberQueryOptions().queryKey, member);
}

export function endMemberSession(queryClient: QueryClient) {
  queryClient.setQueryData(memberQueryOptions().queryKey, null);
}
