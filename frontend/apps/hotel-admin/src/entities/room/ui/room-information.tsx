import type { ReactNode } from "react";
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
  roomTypeTerms?: ReactNode;
};

export function RoomInformation({
  room,
  roomTypeTerms,
}: RoomInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={ROOM_FIELD_LABELS.name}>
          {room.name}
        </DescriptionListItem>
        <DescriptionListItem term={ROOM_FIELD_LABELS.roomType}>
          {room.roomType.name}
        </DescriptionListItem>
        {roomTypeTerms}
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
        <DescriptionListItem term={ROOM_FIELD_LABELS.status}>
          {ROOM_STATUS_LABELS[room.status]}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
