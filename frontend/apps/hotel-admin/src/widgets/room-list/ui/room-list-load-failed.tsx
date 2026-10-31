import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_LIST_CONTENT_MESSAGES } from "../config/messages";

type RoomListLoadFailedProps = {
  onRetry: () => void;
};

export function RoomListLoadFailed({ onRetry }: RoomListLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {ROOM_LIST_CONTENT_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
