import { getRouteApi } from "@tanstack/react-router";
import { HotelNotFound } from "@/entities/hotel";
import { HotelMasterUpdate } from "@/features/hotel-master-update";

const hotelRoute = getRouteApi("/_authenticated/hotels/$hotelId");

export function HotelMasterEditPage() {
  const { hotelId } = hotelRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {hotelId === undefined ? (
        <HotelNotFound />
      ) : (
        <HotelMasterUpdate hotelId={hotelId} />
      )}
    </div>
  );
}
