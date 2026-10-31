import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  GUEST_LIST_FIRST_PAGE,
  isBeyondLastPage,
  isRequestablePage,
  toApiPage,
  useGuestListQuery,
} from "@/entities/guest";
import type { Guest } from "@/shared/api";

export type GuestListCriteria = {
  keyword: string | undefined;
  page: number;
};

export type GuestListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type GuestListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; hasKeyword: boolean }
  | {
      status: "ready";
      guests: readonly Guest[];
      isUpdating: boolean;
      pagination: GuestListPaginationState;
    };

export function useGuestList({
  keyword,
  page,
}: GuestListCriteria): GuestListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useGuestListQuery({
    keyword,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/guests",
        search: { keyword, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, keyword, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/guests", search: { keyword, page: nextPage } });
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
    guests: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > GUEST_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
