import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  HOTEL_LIST_FIRST_PAGE,
  isBeyondLastPage,
  isRequestablePage,
  toApiPage,
  useHotelListQuery,
} from "@/entities/hotel";
import type { Hotel } from "@/shared/api";

export type HotelListCriteria = {
  keyword: string | undefined;
  page: number;
};

export type HotelListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type HotelListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; hasKeyword: boolean }
  | {
      status: "ready";
      hotels: readonly Hotel[];
      isUpdating: boolean;
      pagination: HotelListPaginationState;
    };

export function useHotelList({
  keyword,
  page,
}: HotelListCriteria): HotelListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useHotelListQuery({
    keyword,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/hotels",
        search: { keyword, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, keyword, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/hotels", search: { keyword, page: nextPage } });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return { status: "empty", hasKeyword: keyword !== undefined };
  }
  return {
    status: "ready",
    hotels: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > HOTEL_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
