import { createFileRoute } from "@tanstack/react-router";
import {
  HOTEL_MASTER_EDIT_MESSAGES,
  HotelMasterEditPage,
} from "@/pages/hotel-master-edit";

export const Route = createFileRoute(
  "/_authenticated/hotels/$hotelId/master/edit",
)({
  staticData: { title: HOTEL_MASTER_EDIT_MESSAGES.title },
  component: HotelMasterEditPage,
});
