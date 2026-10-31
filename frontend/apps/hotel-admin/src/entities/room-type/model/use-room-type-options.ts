import { useRoomTypeListQuery } from "../api/room-type-list-query";
import { ROOM_TYPE_OPTION_MESSAGES } from "../config/messages";

type RoomTypeOptionSource = {
  id: number;
  name: string;
};

type RoomTypeOptionsSettings = {
  emptyLabel?: string;
  currentRoomType?: RoomTypeOptionSource;
};

export function useRoomTypeOptions({
  emptyLabel = ROOM_TYPE_OPTION_MESSAGES.placeholder,
  currentRoomType,
}: RoomTypeOptionsSettings = {}) {
  const { data, isError } = useRoomTypeListQuery();
  const roomTypes = data ?? [];
  const isCurrentRoomTypeMissing =
    currentRoomType !== undefined &&
    !roomTypes.some((roomType) => roomType.id === currentRoomType.id);
  const sources: readonly RoomTypeOptionSource[] =
    isCurrentRoomTypeMissing ? [currentRoomType, ...roomTypes] : roomTypes;

  return {
    roomTypeOptions: [
      { value: "", label: emptyLabel },
      ...sources.map((roomType) => ({
        value: String(roomType.id),
        label: roomType.name,
      })),
    ],
    roomTypeHint:
      data === undefined && isError
        ? ROOM_TYPE_OPTION_MESSAGES.loadFailed
        : undefined,
    isRoomTypeEmpty: data !== undefined && data.length === 0,
    isUnlistedRoomType: (roomTypeId: number) =>
      data !== undefined &&
      !data.some((roomType) => roomType.id === roomTypeId),
  };
}
