import { ROOM_LIST_MESSAGES } from "../config/messages";

export function RoomListEmpty() {
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      {ROOM_LIST_MESSAGES.empty}
    </p>
  );
}
