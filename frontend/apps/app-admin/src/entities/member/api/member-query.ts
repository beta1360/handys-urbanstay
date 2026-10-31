import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchMember, memberQueryKey } from "@/shared/api";

function memberQueryOptions(memberId: number) {
  return queryOptions({
    queryKey: memberQueryKey(memberId),
    queryFn: ({ signal }) => fetchMember(memberId, { signal }),
  });
}

export function useMemberQuery(memberId: number) {
  return useQuery(memberQueryOptions(memberId));
}
