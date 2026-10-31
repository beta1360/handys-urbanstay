import { Card } from "@repo/ui/card";
import { ROOM_STATUS_HISTORY_MESSAGES } from "../config/messages";

export function RoomStatusHistoryEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {ROOM_STATUS_HISTORY_MESSAGES.empty}
      </p>
    </Card>
  );
}
