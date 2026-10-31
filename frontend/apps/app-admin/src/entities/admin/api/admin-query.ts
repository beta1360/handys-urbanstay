import { queryOptions, useQuery } from "@tanstack/react-query";
import { adminQueryKey, fetchAdmin } from "@/shared/api";

function adminQueryOptions(adminId: number) {
  return queryOptions({
    queryKey: adminQueryKey(adminId),
    queryFn: ({ signal }) => fetchAdmin(adminId, { signal }),
  });
}

export function useAdminQuery(adminId: number) {
  return useQuery(adminQueryOptions(adminId));
}
