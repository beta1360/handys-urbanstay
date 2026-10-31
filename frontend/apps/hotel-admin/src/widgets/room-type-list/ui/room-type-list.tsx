import { RoomTypeLoading } from "@/entities/room-type";
import { useRoomTypeList } from "../model/use-room-type-list";
import { RoomTypeListEmpty } from "./room-type-list-empty";
import { RoomTypeListLoadFailed } from "./room-type-list-load-failed";
import { RoomTypeTable } from "./room-type-table";

export function RoomTypeList() {
  const state = useRoomTypeList();

  switch (state.status) {
    case "loading":
      return <RoomTypeLoading />;
    case "failed":
      return <RoomTypeListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <RoomTypeListEmpty />;
    case "ready":
      return <RoomTypeTable roomTypes={state.roomTypes} />;
  }
}
