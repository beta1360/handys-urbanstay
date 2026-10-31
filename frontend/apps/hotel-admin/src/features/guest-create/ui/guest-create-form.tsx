import { useGuestCreateForm } from "../model/use-guest-create-form";
import { GuestCreateFormView } from "./guest-create-form-view";

export function GuestCreateForm() {
  const { fields, isSubmitting, handleSubmit } = useGuestCreateForm();

  return (
    <GuestCreateFormView
      fields={fields}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
