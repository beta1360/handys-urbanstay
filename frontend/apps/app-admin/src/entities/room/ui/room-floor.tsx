import { ROOM_INFORMATION_MESSAGES } from "../config/messages";

type RoomFloorProps = {
  floor: number | null;
};

export function RoomFloor({ floor }: RoomFloorProps) {
  return floor ?? (
    <span className="text-neutral-500">
      {ROOM_INFORMATION_MESSAGES.emptyFloor}
    </span>
  );
}
