import { useAdminCreateForm } from "../model/use-admin-create-form";
import { AdminCreateFormView } from "./admin-create-form-view";

export function AdminCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useAdminCreateForm();

  return (
    <AdminCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
