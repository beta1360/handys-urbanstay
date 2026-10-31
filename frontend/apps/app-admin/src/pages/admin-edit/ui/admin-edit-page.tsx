import { getRouteApi } from "@tanstack/react-router";
import { AdminNotFound } from "@/entities/admin";
import { AdminUpdate } from "@/features/admin-update";

const adminRoute = getRouteApi("/_authenticated/admins/$adminId");

export function AdminEditPage() {
  const { adminId } = adminRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {adminId === undefined ? (
        <AdminNotFound />
      ) : (
        <AdminUpdate adminId={adminId} />
      )}
    </div>
  );
}
