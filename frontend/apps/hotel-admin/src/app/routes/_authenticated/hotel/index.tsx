import { createFileRoute } from "@tanstack/react-router";
import { HOTEL_DETAIL_MESSAGES, HotelDetailPage } from "@/pages/hotel-detail";

export const Route = createFileRoute("/_authenticated/hotel/")({
  staticData: { title: HOTEL_DETAIL_MESSAGES.title },
  component: HotelDetailPage,
});
