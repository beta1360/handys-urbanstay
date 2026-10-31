import {
  AdminLoadFailed,
  AdminLoading,
  AdminNotFound,
  useAdmin,
} from "@/entities/admin";
import { AdminUpdateForm } from "./admin-update-form";

type AdminUpdateProps = {
  adminId: number;
};

export function AdminUpdate({ adminId }: AdminUpdateProps) {
  const state = useAdmin(adminId);

  switch (state.status) {
    case "ready":
      return (
        <AdminUpdateForm
          key={adminId}
          adminId={adminId}
          initialAdmin={state.admin}
        />
      );
    case "notFound":
      return <AdminNotFound />;
    case "failed":
      return <AdminLoadFailed onRetry={state.retry} />;
    case "loading":
      return <AdminLoading />;
  }
}
