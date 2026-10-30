import { getRouteApi } from "@tanstack/react-router";
import { HotelLoadState, HotelNotFound, useHotel } from "@/entities/hotel";
import { HotelEditForm } from "./hotel-edit-form";

const hotelRoute = getRouteApi("/_authenticated/hotels/$hotelId");

function HotelEditContent({ hotelId }: { hotelId: number }) {
  const { hotel, isNotFound, isLoadFailed, retry } = useHotel(hotelId);

  if (hotel !== undefined) {
    return (
      <HotelEditForm key={hotelId} hotelId={hotelId} initialHotel={hotel} />
    );
  }
  if (isNotFound) {
    return <HotelNotFound />;
  }
  return <HotelLoadState isLoadFailed={isLoadFailed} onRetry={retry} />;
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
