import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { fetchMemberStays, memberStayListQueryKey } from "@/shared/api";
import type { MemberStayListParams } from "@/shared/api";

function memberStayListQueryOptions(
  memberId: number,
  params: MemberStayListParams,
) {
  return queryOptions({
    queryKey: memberStayListQueryKey(memberId, params),
    queryFn: ({ signal }) => fetchMemberStays(memberId, params, { signal }),
  });
}

export function useMemberStayListQuery(
  memberId: number,
  params: MemberStayListParams,
) {
  return useQuery({
    ...memberStayListQueryOptions(memberId, params),
    placeholderData: keepPreviousData,
  });
}
