import { useRoomSearchForm } from "../model/use-room-search-form";
import type { RoomSearchCriteria } from "../model/use-room-search-form";
import { RoomSearchFormView } from "./room-search-form-view";

export function RoomSearchForm({ keyword, status }: RoomSearchCriteria) {
  const { fields, handleSubmit } = useRoomSearchForm({ keyword, status });

  return <RoomSearchFormView fields={fields} onSubmit={handleSubmit} />;
}
