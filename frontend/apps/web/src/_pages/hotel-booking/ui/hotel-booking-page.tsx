import { Suspense } from "react";
import { HotelBooking } from "@/widgets/hotel-booking";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { LoadingMessage, TextLink } from "@/shared/ui";

type HotelBookingPageProps = {
  params: Promise<{ hotelId: string }>;
};

export function HotelBookingPage({ params }: HotelBookingPageProps) {
  return (
    <section className="flex flex-col gap-6 px-4 py-6">
      <TextLink href={ROUTES.hotels}>{COMMON_MESSAGES.backToHotels}</TextLink>
      <Suspense fallback={<LoadingMessage />}>
        {params.then(({ hotelId }) => (
          <HotelBooking hotelId={hotelId} />
        ))}
      </Suspense>
    </section>
  );
}
