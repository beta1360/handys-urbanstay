import { getRouteApi } from "@tanstack/react-router";
import {
  HotelLoadFailed,
  HotelLoading,
  HotelNotFound,
  useHotel,
} from "@/entities/hotel";
import { HotelEditForm } from "./hotel-edit-form";

const hotelRoute = getRouteApi("/_authenticated/hotels/$hotelId");

function HotelEditContent({ hotelId }: { hotelId: number }) {
  const state = useHotel(hotelId);

  switch (state.status) {
    case "ready":
      return (
        <HotelEditForm
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

export function HotelEditPage() {
  const { hotelId } = hotelRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {hotelId === undefined ? (
        <HotelNotFound />
      ) : (
        <HotelEditContent hotelId={hotelId} />
      )}
    </div>
  );
}
