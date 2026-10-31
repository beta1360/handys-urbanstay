import { COMMON_MESSAGES } from "@/shared/config";
import { Button } from "@/shared/ui";
import { ROOM_TYPE_MESSAGES } from "../config/messages";

type RoomTypesLoadFailedProps = {
  onRetry: () => void;
};

export function RoomTypesLoadFailed({ onRetry }: RoomTypesLoadFailedProps) {
  return (
    <div className="flex flex-col gap-2">
      <p role="alert" className="text-sm text-gray-700">
        {ROOM_TYPE_MESSAGES.loadFailed}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {COMMON_MESSAGES.retry}
      </Button>
    </div>
  );
}
