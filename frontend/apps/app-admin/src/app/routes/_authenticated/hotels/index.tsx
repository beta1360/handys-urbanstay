import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  HOTEL_LIST_DEFAULT_SEARCH,
  HOTEL_LIST_MESSAGES,
  HotelListPage,
  hotelListSearchSchema,
} from "@/pages/hotel-list";

export const Route = createFileRoute("/_authenticated/hotels/")({
  validateSearch: hotelListSearchSchema,
  search: {
    middlewares: [stripSearchParams(HOTEL_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: HOTEL_LIST_MESSAGES.title },
  component: HotelListPage,
});
