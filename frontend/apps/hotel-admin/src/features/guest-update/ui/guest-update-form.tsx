import { GuestNotFound } from "@/entities/guest";
import type { Guest } from "@/shared/api";
import { useGuestUpdateForm } from "../model/use-guest-update-form";
import { GuestUpdateFormView } from "./guest-update-form-view";

type GuestUpdateFormProps = {
  guestId: number;
  initialGuest: Guest;
};

export function GuestUpdateForm({
  guestId,
  initialGuest,
}: GuestUpdateFormProps) {
  const {
    fields,
    alert,
    status,
    reloadButtonRef,
    handleSubmit,
    reload,
  } = useGuestUpdateForm(guestId, initialGuest);

  if (status === "notFound") {
    return <GuestNotFound />;
  }
  return (
    <GuestUpdateFormView
      guestId={guestId}
      fields={fields}
      alert={alert}
      status={status}
      reloadButtonRef={reloadButtonRef}
      onSubmit={handleSubmit}
      onReload={reload}
    />
  );
}
