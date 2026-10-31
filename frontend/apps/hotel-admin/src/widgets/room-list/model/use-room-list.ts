import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  ROOM_LIST_FIRST_PAGE,
  toApiPage,
  useRoomListQuery,
} from "@/entities/room";
import type { Room, RoomStatus } from "@/shared/api";

export type RoomListCriteria = {
  keyword: string | undefined;
  status: RoomStatus | undefined;
  page: number;
};

export type RoomListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type RoomListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; isFiltered: boolean }
  | {
      status: "ready";
      rooms: readonly Room[];
      isUpdating: boolean;
      pagination: RoomListPaginationState;
    };

export function useRoomList({
  keyword,
  status,
  page,
}: RoomListCriteria): RoomListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useRoomListQuery({
    keyword,
    status,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/rooms",
        search: { keyword, status, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, keyword, status, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/rooms", search: { keyword, status, page: nextPage } });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return {
      status: "empty",
      isFiltered: keyword !== undefined || status !== undefined,
    };
  }
  return {
    status: "ready",
    rooms: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > ROOM_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
