import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { hotelListQueryOptions } from "@/shared/api";
import type { HotelPage } from "@/shared/api";
import {
  getLastPage,
  HOTEL_LIST_FIRST_PAGE,
  isBeyondLastPage,
  isRequestablePage,
  toHotelListParams,
} from "./hotel-list-search";
import type { HotelListSearch } from "./hotel-list-search";

const hotelListRoute = getRouteApi("/_authenticated/hotels/");

function keepPreviousPageInRange(previousData: HotelPage | undefined) {
  return previousData && !isBeyondLastPage(previousData)
    ? previousData
    : undefined;
}

export function useHotelList() {
  const search = hotelListRoute.useSearch();
  const navigate = hotelListRoute.useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useQuery({
    ...hotelListQueryOptions(toHotelListParams(search)),
    placeholderData: keepPreviousPageInRange,
  });
  const { keyword, page } = search;
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({ search: { keyword, page: lastPage }, replace: true });
    }
  }, [isOverflow, keyword, lastPage, navigate]);

  function moveTo(nextSearch: HotelListSearch) {
    void navigate({ search: nextSearch });
  }

  return {
    keyword,
    page,
    hotelPage: isOverflow ? undefined : data,
    isLoadFailed: isError,
    isUpdating: isPlaceholderData,
    hasPrevious: page > HOTEL_LIST_FIRST_PAGE,
    hasNext: page < totalPages && isRequestablePage(page + 1),
    searchKeyword: (nextKeyword: string | undefined) =>
      moveTo({ keyword: nextKeyword, page: HOTEL_LIST_FIRST_PAGE }),
    goToPreviousPage: () => moveTo({ keyword, page: page - 1 }),
    goToNextPage: () => moveTo({ keyword, page: page + 1 }),
    retry: () => void refetch(),
  };
}
