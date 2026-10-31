import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  STAY_LIST_FIRST_PAGE,
  toApiPage,
  useStayListQuery,
} from "@/entities/stay";
import type { Stay } from "@/shared/api";

export type StayListCriteria = {
  roomId: number | undefined;
  guestId: number | undefined;
  canceled: boolean | undefined;
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
  page,
}: StayListCriteria): StayListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useStayListQuery({
    roomId,
    guestId,
    canceled,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/stays",
        search: { roomId, guestId, canceled, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, roomId, guestId, canceled, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({
      to: "/stays",
      search: { roomId, guestId, canceled, page: nextPage },
    });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return {
      status: "empty",
      isFiltered:
        roomId !== undefined || guestId !== undefined || canceled !== undefined,
    };
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
