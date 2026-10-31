import { HotelLoadFailed, HotelLoading, useHotel } from "@/entities/hotel";
import { HotelUpdateForm } from "./hotel-update-form";

export function HotelUpdate() {
  const state = useHotel();

  switch (state.status) {
    case "ready":
      return <HotelUpdateForm initialHotel={state.hotel} />;
    case "failed":
      return <HotelLoadFailed onRetry={state.retry} />;
    case "loading":
      return <HotelLoading />;
  }
}
