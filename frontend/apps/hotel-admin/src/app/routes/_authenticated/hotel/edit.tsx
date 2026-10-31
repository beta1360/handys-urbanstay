import { createFileRoute } from "@tanstack/react-router";
import { HOTEL_EDIT_MESSAGES, HotelEditPage } from "@/pages/hotel-edit";

export const Route = createFileRoute("/_authenticated/hotel/edit")({
  staticData: { title: HOTEL_EDIT_MESSAGES.title },
  component: HotelEditPage,
});
