import { createFileRoute } from "@tanstack/react-router";
import { HOTEL_CREATE_MESSAGES, HotelCreatePage } from "@/pages/hotel-create";

export const Route = createFileRoute("/_authenticated/hotels/new")({
  staticData: { title: HOTEL_CREATE_MESSAGES.title },
  component: HotelCreatePage,
});
