import { createFileRoute } from "@tanstack/react-router";
import {
  parseHotelPathParams,
  stringifyHotelPathParams,
} from "@/entities/hotel";

export const Route = createFileRoute("/_authenticated/hotels/$hotelId")({
  params: {
    parse: parseHotelPathParams,
    stringify: stringifyHotelPathParams,
  },
});
