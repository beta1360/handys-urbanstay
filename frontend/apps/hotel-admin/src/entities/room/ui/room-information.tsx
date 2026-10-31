import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Room } from "@/shared/api";
import {
  ROOM_FIELD_LABELS,
  ROOM_INFORMATION_MESSAGES,
  ROOM_STATUS_LABELS,
} from "../config/messages";
import { RoomFloor } from "./room-floor";

type RoomInformationProps = {
  room: Room;
};

export function RoomInformation({ room }: RoomInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={ROOM_FIELD_LABELS.name}>
          {room.name}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.type}>
          {room.type}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.capacity}>
          {room.capacity}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.floor}>
          <RoomFloor floor={room.floor} />
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.description}>
          {room.description ?? (
            <span className="text-neutral-500">
              {ROOM_INFORMATION_MESSAGES.emptyDescription}
            </span>
          )}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.checkInTime}>
          {room.checkInTime}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.checkOutTime}>
          {room.checkOutTime}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.status}>
          {ROOM_STATUS_LABELS[room.status]}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
