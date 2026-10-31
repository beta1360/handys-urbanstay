import { Card } from "@repo/ui/card";
import { HOTEL_ROOM_LIST_MESSAGES } from "../config/messages";

export function HotelRoomListEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {HOTEL_ROOM_LIST_MESSAGES.empty}
      </p>
    </Card>
  );
}
