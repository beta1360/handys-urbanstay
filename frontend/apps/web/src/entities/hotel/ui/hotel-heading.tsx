import { loadHotel } from "../model/load-hotel";
import { HotelHeadingView } from "./hotel-heading-view";

type HotelHeadingProps = {
  hotelId: string;
  caption: string;
};

export async function HotelHeading({ hotelId, caption }: HotelHeadingProps) {
  const hotel = await loadHotel(hotelId);

  return <HotelHeadingView caption={caption} hotelName={hotel.name} />;
}
