import { useId } from "react";
import { HotelLoading } from "@/entities/hotel";
import { ROOM_FIELD_LABELS } from "@/entities/room";
import { useHotelRoomList } from "../model/use-hotel-room-list";
import type { HotelRoomListState } from "../model/use-hotel-room-list";
import { HotelRoomListEmpty } from "./hotel-room-list-empty";
import { HotelRoomListLoadFailed } from "./hotel-room-list-load-failed";
import { HotelRoomListPagination } from "./hotel-room-list-pagination";
import { HotelRoomTable } from "./hotel-room-table";

type HotelRoomListContentProps = {
  state: HotelRoomListState;
};

function HotelRoomListContent({ state }: HotelRoomListContentProps) {
  switch (state.status) {
    case "loading":
      return <HotelLoading />;
    case "failed":
      return <HotelRoomListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <HotelRoomListEmpty />;
    case "ready":
      return (
        <>
          <HotelRoomTable rooms={state.rooms} isUpdating={state.isUpdating} />
          <HotelRoomListPagination {...state.pagination} />
        </>
      );
  }
}

type HotelRoomListProps = {
  hotelId: number;
};

export function HotelRoomList({ hotelId }: HotelRoomListProps) {
  const headingId = useId();
  const state = useHotelRoomList(hotelId);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="text-base font-semibold text-neutral-900"
      >
        {ROOM_FIELD_LABELS.room}
      </h2>
      <HotelRoomListContent state={state} />
    </section>
  );
}
