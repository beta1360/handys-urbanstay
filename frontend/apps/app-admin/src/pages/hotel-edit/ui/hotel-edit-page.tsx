import { getRouteApi } from "@tanstack/react-router";
import { HotelNotFound } from "@/entities/hotel";
import { HotelUpdate } from "@/features/hotel-update";

const hotelRoute = getRouteApi("/_authenticated/hotels/$hotelId");

export function HotelEditPage() {
  const { hotelId } = hotelRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {hotelId === undefined ? (
        <HotelNotFound />
      ) : (
        <HotelUpdate hotelId={hotelId} />
      )}
    </div>
  );
}
