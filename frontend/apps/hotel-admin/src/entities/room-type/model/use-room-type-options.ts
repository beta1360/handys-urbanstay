import { useRoomTypeListQuery } from "../api/room-type-list-query";
import { ROOM_TYPE_OPTION_MESSAGES } from "../config/messages";

export function useRoomTypeOptions() {
  const { data, isError } = useRoomTypeListQuery();

  return {
    roomTypeOptions: [
      { value: "", label: ROOM_TYPE_OPTION_MESSAGES.placeholder },
      ...(data ?? []).map((roomType) => ({
        value: String(roomType.id),
        label: roomType.name,
      })),
    ],
    roomTypeHint:
      data === undefined && isError
        ? ROOM_TYPE_OPTION_MESSAGES.loadFailed
        : undefined,
  };
}
