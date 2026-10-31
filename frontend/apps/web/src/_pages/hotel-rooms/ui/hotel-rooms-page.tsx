import { Suspense } from "react";
import { HotelRoomList } from "@/entities/room";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { LoadingMessage, TextLink } from "@/shared/ui";
import { HOTEL_ROOMS_PAGE_MESSAGES } from "../config/messages";

type HotelRoomsPageProps = {
  params: Promise<{ hotelId: string }>;
};

export function HotelRoomsPage({ params }: HotelRoomsPageProps) {
  return (
    <section className="flex flex-col gap-4 px-4 py-6">
      <TextLink href={ROUTES.hotels}>{COMMON_MESSAGES.backToHotels}</TextLink>
      <h1 className="text-xl font-bold text-gray-900">
        {HOTEL_ROOMS_PAGE_MESSAGES.title}
      </h1>
      <Suspense fallback={<LoadingMessage />}>
        {params.then(({ hotelId }) => (
          <HotelRoomList hotelId={hotelId} />
        ))}
      </Suspense>
    </section>
  );
}
