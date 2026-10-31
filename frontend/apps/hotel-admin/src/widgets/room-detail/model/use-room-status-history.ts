import { useState } from "react";
import {
  isRequestableStatusHistoryPage,
  ROOM_LIST_FIRST_PAGE,
  toApiPage,
  useRoomStatusHistoryQuery,
} from "@/entities/room";
import type { RoomStatusHistory } from "@/shared/api";

export type RoomStatusHistoryPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type RoomStatusHistoryState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      histories: readonly RoomStatusHistory[];
      isUpdating: boolean;
      pagination: RoomStatusHistoryPaginationState;
    };

export function useRoomStatusHistory(roomId: number): RoomStatusHistoryState {
  const [page, setPage] = useState(ROOM_LIST_FIRST_PAGE);
  const { data, isError, isPlaceholderData, refetch } =
    useRoomStatusHistoryQuery(roomId, { page: toApiPage(page) });

  if (data === undefined) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return { status: "empty" };
  }
  return {
    status: "ready",
    histories: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages: data.totalPages,
      hasPrevious: page > ROOM_LIST_FIRST_PAGE,
      hasNext:
        page < data.totalPages && isRequestableStatusHistoryPage(page + 1),
      goToPreviousPage: () => setPage(page - 1),
      goToNextPage: () => setPage(page + 1),
    },
  };
}
