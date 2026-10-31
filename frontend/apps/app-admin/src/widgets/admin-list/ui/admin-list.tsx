import { AdminLoading } from "@/entities/admin";
import { useAdminList } from "../model/use-admin-list";
import type { AdminListCriteria } from "../model/use-admin-list";
import { AdminListEmpty } from "./admin-list-empty";
import { AdminListLoadFailed } from "./admin-list-load-failed";
import { AdminListPagination } from "./admin-list-pagination";
import { AdminTable } from "./admin-table";

export function AdminList({ page }: AdminListCriteria) {
  const state = useAdminList({ page });

  switch (state.status) {
    case "loading":
      return <AdminLoading />;
    case "failed":
      return <AdminListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <AdminListEmpty />;
    case "ready":
      return (
        <>
          <AdminTable admins={state.admins} isUpdating={state.isUpdating} />
          <AdminListPagination {...state.pagination} />
        </>
      );
  }
}
