import { getRouteApi } from "@tanstack/react-router";
import { AdminNotFound } from "@/entities/admin";
import { AdminDetail } from "@/widgets/admin-detail";

const adminDetailRoute = getRouteApi("/_authenticated/admins/$adminId");

export function AdminDetailPage() {
  const { adminId } = adminDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {adminId === undefined ? (
        <AdminNotFound />
      ) : (
        <AdminDetail adminId={adminId} />
      )}
    </div>
  );
}
