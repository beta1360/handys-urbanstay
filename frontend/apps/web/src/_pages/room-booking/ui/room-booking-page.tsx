import { Suspense } from "react";
import { RoomBooking } from "@/widgets/room-booking";
import { LoadingMessage } from "@/shared/ui";

type RoomBookingPageProps = {
  params: Promise<{ hotelId: string; roomId: string }>;
};

export function RoomBookingPage({ params }: RoomBookingPageProps) {
  return (
    <section className="flex flex-col gap-4 px-4 py-6">
      <Suspense fallback={<LoadingMessage />}>
        {params.then(({ hotelId, roomId }) => (
          <RoomBooking hotelId={hotelId} roomId={roomId} />
        ))}
      </Suspense>
    </section>
  );
}
