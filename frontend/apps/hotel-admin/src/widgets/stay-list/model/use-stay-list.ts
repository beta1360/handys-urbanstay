import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  hasStayListFilter,
  isBeyondLastPage,
  isRequestablePage,
  STAY_LIST_FIRST_PAGE,
  toStayListParams,
  useStayListQuery,
} from "@/entities/stay";
import type { StayListFilter } from "@/entities/stay";
import type { Stay } from "@/shared/api";

export type StayListCriteria = StayListFilter & {
  page: number;
};

export type StayListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type StayListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; isFiltered: boolean }
  | {
      status: "ready";
      stays: readonly Stay[];
      isUpdating: boolean;
      pagination: StayListPaginationState;
    };

export function useStayList({
  roomId,
  guestId,
  canceled,
  keyword,
  checkInFrom,
  checkInTo,
  page,
}: StayListCriteria): StayListState {
  const navigate = useNavigate();
  const filter = { roomId, guestId, canceled, keyword, checkInFrom, checkInTo };
  const { data, isError, isPlaceholderData, refetch } = useStayListQuery(
    toStayListParams(filter, page),
  );
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/stays",
        search: {
          roomId,
          guestId,
          canceled,
          keyword,
          checkInFrom,
          checkInTo,
          page: lastPage,
        },
        replace: true,
      });
    }
  }, [
    isOverflow,
    roomId,
    guestId,
    canceled,
    keyword,
    checkInFrom,
    checkInTo,
    lastPage,
    navigate,
  ]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/stays", search: { ...filter, page: nextPage } });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return { status: "empty", isFiltered: hasStayListFilter(filter) };
  }
  return {
    status: "ready",
    stays: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > STAY_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
