import {
  GuestInformation,
  GuestLoadFailed,
  GuestLoading,
  GuestNotFound,
  useGuest,
} from "@/entities/guest";
import { GuestDetailActions } from "./guest-detail-actions";

type GuestDetailProps = {
  guestId: number;
};

export function GuestDetail({ guestId }: GuestDetailProps) {
  const state = useGuest(guestId);

  switch (state.status) {
    case "notFound":
      return <GuestNotFound />;
    case "loading":
      return (
        <>
          <GuestDetailActions />
          <GuestLoading />
        </>
      );
    case "failed":
      return (
        <>
          <GuestDetailActions />
          <GuestLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <GuestDetailActions guestId={state.guest.id} />
          <GuestInformation guest={state.guest} />
        </>
      );
  }
}
