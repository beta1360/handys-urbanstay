import {
  AdminInformation,
  AdminLoadFailed,
  AdminLoading,
  AdminNotFound,
  useAdmin,
} from "@/entities/admin";
import { AdminDetailActions } from "./admin-detail-actions";

type AdminDetailProps = {
  adminId: number;
};

export function AdminDetail({ adminId }: AdminDetailProps) {
  const state = useAdmin(adminId);

  switch (state.status) {
    case "notFound":
      return <AdminNotFound />;
    case "loading":
      return (
        <>
          <AdminDetailActions />
          <AdminLoading />
        </>
      );
    case "failed":
      return (
        <>
          <AdminDetailActions />
          <AdminLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <AdminDetailActions />
          <AdminInformation admin={state.admin} />
        </>
      );
  }
}
