import type { Room } from "@/shared/api";
import { ROOM_LABELS, ROOM_MESSAGES } from "../config/messages";

type RoomSummaryProps = {
  room: Room;
};

export function RoomSummary({ room }: RoomSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {room.name}
        </span>
        <span className="text-sm text-gray-500">{room.type}</span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-gray-500">{ROOM_LABELS.capacity}</dt>
          <dd className="font-medium text-gray-900">
            {ROOM_MESSAGES.capacity(room.capacity)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-gray-500">{ROOM_LABELS.checkInTime}</dt>
          <dd className="font-medium text-gray-900">{room.checkInTime}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-gray-500">{ROOM_LABELS.checkOutTime}</dt>
          <dd className="font-medium text-gray-900">{room.checkOutTime}</dd>
        </div>
      </dl>
    </div>
  );
}
