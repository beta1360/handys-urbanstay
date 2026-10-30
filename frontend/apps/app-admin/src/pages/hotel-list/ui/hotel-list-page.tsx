import { getRouteApi } from "@tanstack/react-router";
import { ButtonLink } from "@repo/admin-kit/link";
import { HotelSearchForm } from "@/features/hotel-search";
import { HotelList } from "@/widgets/hotel-list";
import { HOTEL_LIST_MESSAGES } from "../config/messages";

const hotelListRoute = getRouteApi("/_authenticated/hotels/");

export function HotelListPage() {
  const { keyword, page } = hotelListRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <HotelSearchForm keyword={keyword} />
        <ButtonLink to="/hotels/new" variant="primary">
          {HOTEL_LIST_MESSAGES.create}
        </ButtonLink>
      </div>
      <HotelList keyword={keyword} page={page} />
    </div>
  );
}
