import { useRoomSearchForm } from "../model/use-room-search-form";
import type { RoomSearchCriteria } from "../model/use-room-search-form";
import { RoomSearchFormView } from "./room-search-form-view";

export function RoomSearchForm({
  keyword,
  status,
  roomTypeId,
}: RoomSearchCriteria) {
  const { fields, roomTypeOptions, roomTypeHint, handleSubmit } =
    useRoomSearchForm({ keyword, status, roomTypeId });

  return (
    <RoomSearchFormView
      fields={fields}
      roomTypeOptions={roomTypeOptions}
      roomTypeHint={roomTypeHint}
      onSubmit={handleSubmit}
    />
  );
}
