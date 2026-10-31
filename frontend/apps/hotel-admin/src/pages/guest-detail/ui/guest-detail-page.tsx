import { getRouteApi } from "@tanstack/react-router";
import { GuestNotFound } from "@/entities/guest";
import { GuestDetail } from "@/widgets/guest-detail";

const guestDetailRoute = getRouteApi("/_authenticated/guests/$guestId");

export function GuestDetailPage() {
  const { guestId } = guestDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {guestId === undefined ? (
        <GuestNotFound />
      ) : (
        <GuestDetail guestId={guestId} />
      )}
    </div>
  );
}
