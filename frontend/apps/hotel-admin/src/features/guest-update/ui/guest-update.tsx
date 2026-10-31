import {
  GuestLoadFailed,
  GuestLoading,
  GuestNotFound,
  useGuest,
} from "@/entities/guest";
import { GuestUpdateForm } from "./guest-update-form";

type GuestUpdateProps = {
  guestId: number;
};

export function GuestUpdate({ guestId }: GuestUpdateProps) {
  const state = useGuest(guestId);

  switch (state.status) {
    case "ready":
      return (
        <GuestUpdateForm
          key={guestId}
          guestId={guestId}
          initialGuest={state.guest}
        />
      );
    case "notFound":
      return <GuestNotFound />;
    case "failed":
      return <GuestLoadFailed onRetry={state.retry} />;
    case "loading":
      return <GuestLoading />;
  }
}
