import { HotelHeadingView } from "@/entities/hotel";
import { StayReserve } from "@/features/stay-reserve";
import { StaySearch } from "@/features/stay-search";
import { HOTEL_BOOKING_MESSAGES } from "../config/messages";
import { loadHotelBooking } from "../model/load-hotel-booking";

type HotelBookingProps = {
  hotelId: string;
};

export async function HotelBooking({ hotelId }: HotelBookingProps) {
  const booking = await loadHotelBooking(hotelId);

  return (
    <>
      <HotelHeadingView
        caption={HOTEL_BOOKING_MESSAGES.caption}
        hotelName={booking.hotelName}
      />
      <StayReserve hotelId={booking.hotelId}>
        <StaySearch />
      </StayReserve>
    </>
  );
}
