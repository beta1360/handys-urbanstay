import { getRouteApi } from "@tanstack/react-router";
import { GuestNotFound } from "@/entities/guest";
import { GuestUpdate } from "@/features/guest-update";

const guestRoute = getRouteApi("/_authenticated/guests/$guestId");

export function GuestEditPage() {
  const { guestId } = guestRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {guestId === undefined ? (
        <GuestNotFound />
      ) : (
        <GuestUpdate guestId={guestId} />
      )}
    </div>
  );
}
