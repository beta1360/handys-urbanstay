import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchMembers, memberListQueryKey } from "@/shared/api";
import type { MemberListParams, MemberPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/member-page";

function memberListQueryOptions(params: MemberListParams) {
  return queryOptions({
    queryKey: memberListQueryKey(params),
    queryFn: ({ signal }) => fetchMembers(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: MemberPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useMemberListQuery(params: MemberListParams) {
  return useQuery({
    ...memberListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
