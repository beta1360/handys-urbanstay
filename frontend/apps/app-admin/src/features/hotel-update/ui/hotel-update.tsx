import {
  HotelLoadFailed,
  HotelLoading,
  HotelNotFound,
  useHotel,
} from "@/entities/hotel";
import { HotelUpdateForm } from "./hotel-update-form";

type HotelUpdateProps = {
  hotelId: number;
};

export function HotelUpdate({ hotelId }: HotelUpdateProps) {
  const state = useHotel(hotelId);

  switch (state.status) {
    case "ready":
      return (
        <HotelUpdateForm
          key={hotelId}
          hotelId={hotelId}
          initialHotel={state.hotel}
        />
      );
    case "notFound":
      return <HotelNotFound />;
    case "failed":
      return <HotelLoadFailed onRetry={state.retry} />;
    case "loading":
      return <HotelLoading />;
  }
}
