import { createFileRoute } from "@tanstack/react-router";
import {
  HOTEL_DETAIL_MESSAGES,
  HotelDetailPage,
  parseHotelDetailParams,
  stringifyHotelDetailParams,
} from "@/pages/hotel-detail";

export const Route = createFileRoute("/_authenticated/hotels/$hotelId")({
  params: {
    parse: parseHotelDetailParams,
    stringify: stringifyHotelDetailParams,
  },
  staticData: { title: HOTEL_DETAIL_MESSAGES.title },
  component: HotelDetailPage,
});
