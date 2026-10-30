import { HotelLoading } from "@/entities/hotel";
import { useHotelList } from "../model/use-hotel-list";
import type { HotelListCriteria } from "../model/use-hotel-list";
import { HotelListEmpty } from "./hotel-list-empty";
import { HotelListLoadFailed } from "./hotel-list-load-failed";
import { HotelListPagination } from "./hotel-list-pagination";
import { HotelTable } from "./hotel-table";

export function HotelList({ keyword, page }: HotelListCriteria) {
  const state = useHotelList({ keyword, page });

  switch (state.status) {
    case "loading":
      return <HotelLoading />;
    case "failed":
      return <HotelListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <HotelListEmpty hasKeyword={state.hasKeyword} />;
    case "ready":
      return (
        <>
          <HotelTable hotels={state.hotels} isUpdating={state.isUpdating} />
          <HotelListPagination {...state.pagination} />
        </>
      );
  }
}
