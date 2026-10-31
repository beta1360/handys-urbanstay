import { useState } from "react";
import {
  isRequestableRoomPage,
  ROOM_LIST_FIRST_PAGE,
  toApiPage,
  useHotelRoomListQuery,
} from "@/entities/room";
import type { HotelRoom } from "@/shared/api";

export type HotelRoomListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type HotelRoomListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      rooms: readonly HotelRoom[];
      isUpdating: boolean;
      pagination: HotelRoomListPaginationState;
    };

export function useHotelRoomList(hotelId: number): HotelRoomListState {
  const [page, setPage] = useState(ROOM_LIST_FIRST_PAGE);
  const { data, isError, isPlaceholderData, refetch } = useHotelRoomListQuery(
    hotelId,
    { page: toApiPage(page) },
  );

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
    rooms: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages: data.totalPages,
      hasPrevious: page > ROOM_LIST_FIRST_PAGE,
      hasNext: page < data.totalPages && isRequestableRoomPage(page + 1),
      goToPreviousPage: () => setPage(page - 1),
      goToNextPage: () => setPage(page + 1),
    },
  };
}
