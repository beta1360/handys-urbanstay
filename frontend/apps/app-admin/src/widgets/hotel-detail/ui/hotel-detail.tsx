import {
  HotelInformation,
  HotelLoadFailed,
  HotelLoading,
  HotelNotFound,
  useHotel,
} from "@/entities/hotel";
import { HotelDetailActions } from "./hotel-detail-actions";

type HotelDetailProps = {
  hotelId: number;
};

export function HotelDetail({ hotelId }: HotelDetailProps) {
  const state = useHotel(hotelId);

  switch (state.status) {
    case "notFound":
      return <HotelNotFound />;
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
          <HotelDetailActions editHotelId={state.hotel.id} />
          <HotelInformation hotel={state.hotel} />
        </>
      );
  }
}
