import { getRouteApi } from "@tanstack/react-router";
import { AdminList } from "@/widgets/admin-list";

const adminListRoute = getRouteApi("/_authenticated/admins/");

export function AdminListPage() {
  const { page } = adminListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <AdminList page={page} />
    </div>
  );
}
