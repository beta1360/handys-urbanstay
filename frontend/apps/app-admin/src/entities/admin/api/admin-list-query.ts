import { queryOptions, useQuery } from "@tanstack/react-query";
import { adminListQueryKey, fetchAdmins } from "@/shared/api";
import type { AdminListParams, AdminPage } from "@/shared/api";
import { isBeyondLastPage } from "../lib/admin-page";

function adminListQueryOptions(params: AdminListParams) {
  return queryOptions({
    queryKey: adminListQueryKey(params),
    queryFn: ({ signal }) => fetchAdmins(params, { signal }),
  });
}

function keepPreviousPageInRange(previousData: AdminPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useAdminListQuery(params: AdminListParams) {
  return useQuery({
    ...adminListQueryOptions(params),
    placeholderData: keepPreviousPageInRange,
  });
}
