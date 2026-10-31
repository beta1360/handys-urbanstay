import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { adminListQueryKey, adminQueryKey, fetchAdmin } from "@/shared/api";
import type { Admin } from "@/shared/api";

function adminQueryOptions(adminId: number) {
  return queryOptions({
    queryKey: adminQueryKey(adminId),
    queryFn: ({ signal }) => fetchAdmin(adminId, { signal }),
  });
}

export function useAdminQuery(adminId: number) {
  return useQuery(adminQueryOptions(adminId));
}

export function cacheSavedAdmin(queryClient: QueryClient, admin: Admin) {
  void queryClient.invalidateQueries({ queryKey: adminListQueryKey() });
  queryClient.setQueryData(adminQueryOptions(admin.id).queryKey, admin);
}
