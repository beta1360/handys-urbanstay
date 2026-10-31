import { getRouteApi } from "@tanstack/react-router";
import { ButtonLink } from "@repo/admin-kit/link";
import { AdminList } from "@/widgets/admin-list";
import { ADMIN_LIST_MESSAGES } from "../config/messages";

const adminListRoute = getRouteApi("/_authenticated/admins/");

export function AdminListPage() {
  const { page } = adminListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ButtonLink to="/admins/new" variant="primary">
          {ADMIN_LIST_MESSAGES.create}
        </ButtonLink>
      </div>
      <AdminList page={page} />
    </div>
  );
}
