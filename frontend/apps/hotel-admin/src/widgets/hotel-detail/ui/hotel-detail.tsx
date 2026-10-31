import {
  HotelInformation,
  HotelLoadFailed,
  HotelLoading,
  useHotel,
} from "@/entities/hotel";
import { HotelDetailActions } from "./hotel-detail-actions";

export function HotelDetail() {
  const state = useHotel();

  switch (state.status) {
    case "loading":
      return (
        <>
          <HotelDetailActions />
          <HotelLoading />
        </>
      );
    case "failed":
      return (
        <>
          <HotelDetailActions />
          <HotelLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <HotelDetailActions canEdit />
          <HotelInformation hotel={state.hotel} />
        </>
      );
  }
}
