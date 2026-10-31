import { Card } from "@repo/ui/card";
import { ROOM_TYPE_LIST_CONTENT_MESSAGES } from "../config/messages";

export function RoomTypeListEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {ROOM_TYPE_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
