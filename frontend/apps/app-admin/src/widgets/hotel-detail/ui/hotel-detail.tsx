import {
  HotelInformation,
  HotelLoadFailed,
  HotelLoading,
  HotelNotFound,
  useHotel,
} from "@/entities/hotel";
import { HotelDetailActions } from "./hotel-detail-actions";
import { HotelMasterPanel } from "./hotel-master-panel";
import { HotelRoomList } from "./hotel-room-list";

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
          <HotelMasterPanel hotelId={state.hotel.id} />
          <HotelRoomList key={state.hotel.id} hotelId={state.hotel.id} />
        </>
      );
  }
}
