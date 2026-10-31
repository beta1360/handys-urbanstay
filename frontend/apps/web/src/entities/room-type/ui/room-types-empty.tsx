import { ROOM_TYPE_MESSAGES } from "../config/messages";

export function RoomTypesEmpty() {
  return (
    <p className="py-4 text-center text-sm text-gray-500">
      {ROOM_TYPE_MESSAGES.empty}
    </p>
  );
}
