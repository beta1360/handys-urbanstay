import { getRouteApi } from "@tanstack/react-router";
import { HotelNotFound } from "@/entities/hotel";
import { HotelDetail } from "@/widgets/hotel-detail";

const hotelDetailRoute = getRouteApi("/_authenticated/hotels/$hotelId");

export function HotelDetailPage() {
  const { hotelId } = hotelDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {hotelId === undefined ? (
        <HotelNotFound />
      ) : (
        <HotelDetail hotelId={hotelId} />
      )}
    </div>
  );
}
