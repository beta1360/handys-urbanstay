import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_STATUS_HISTORY_MESSAGES } from "../config/messages";

type RoomStatusHistoryLoadFailedProps = {
  onRetry: () => void;
};

export function RoomStatusHistoryLoadFailed({
  onRetry,
}: RoomStatusHistoryLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {ROOM_STATUS_HISTORY_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
