import { HotelHeadingView } from "@/entities/hotel";
import { RoomSummary } from "@/entities/room";
import { ReservedPeriods } from "@/entities/stay";
import { StayReserve } from "@/features/stay-reserve";
import { TextLink } from "@/shared/ui";
import { ROOM_BOOKING_MESSAGES } from "../config/messages";
import { loadRoomBooking } from "../model/load-room-booking";

type RoomBookingProps = {
  hotelId: string;
  roomId: string;
};

export async function RoomBooking({ hotelId, roomId }: RoomBookingProps) {
  const { hotelName, room, roomListHref } = await loadRoomBooking(
    hotelId,
    roomId,
  );

  return (
    <StayReserve room={room}>
      <TextLink href={roomListHref}>{ROOM_BOOKING_MESSAGES.backToRooms}</TextLink>
      <HotelHeadingView
        caption={ROOM_BOOKING_MESSAGES.caption}
        hotelName={hotelName}
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <RoomSummary room={room} />
      </div>
      <ReservedPeriods roomId={room.id} />
    </StayReserve>
  );
}
