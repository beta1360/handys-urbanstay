import { useId } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { ROOM_STATUS_LABELS } from "@/entities/room";
import type { RoomStatus } from "@/shared/api";
import { ROOM_STATUS_CHANGE_MESSAGES } from "../config/messages";
import type { RoomStatusChangeStatus } from "../model/use-room-status-change";

type RoomStatusChangeViewProps = {
  status: RoomStatusChangeStatus;
  nextStatuses: readonly RoomStatus[];
  onChange: (to: RoomStatus) => void;
};

export function RoomStatusChangeView({
  status,
  nextStatuses,
  onChange,
}: RoomStatusChangeViewProps) {
  const titleId = useId();

  return (
    <Card>
      <div
        role="group"
        aria-labelledby={titleId}
        className="flex flex-col gap-3"
      >
        <h2 id={titleId} className="text-sm font-medium text-neutral-600">
          {ROOM_STATUS_CHANGE_MESSAGES.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => (
            <Button
              key={nextStatus}
              type="button"
              variant="secondary"
              disabled={status === "changing"}
              onClick={() => onChange(nextStatus)}
            >
              {ROOM_STATUS_LABELS[nextStatus]}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
