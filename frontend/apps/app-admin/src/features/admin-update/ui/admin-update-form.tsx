import { AdminNotFound } from "@/entities/admin";
import type { Admin } from "@/shared/api";
import { useAdminUpdateForm } from "../model/use-admin-update-form";
import { AdminUpdateFormView } from "./admin-update-form-view";

type AdminUpdateFormProps = {
  adminId: number;
  initialAdmin: Admin;
};

export function AdminUpdateForm({
  adminId,
  initialAdmin,
}: AdminUpdateFormProps) {
  const { fields, alert, status, reloadButtonRef, handleSubmit, reload } =
    useAdminUpdateForm(adminId, initialAdmin);

  if (status === "notFound") {
    return <AdminNotFound />;
  }
  return (
    <AdminUpdateFormView
      adminId={adminId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
