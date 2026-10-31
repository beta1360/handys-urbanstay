import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { RoomType } from "@/shared/api";
import { ROOM_TYPE_FIELD_LABELS } from "../config/messages";
import { RoomTypeTerms } from "./room-type-terms";

type RoomTypeInformationProps = {
  roomType: RoomType;
};

export function RoomTypeInformation({ roomType }: RoomTypeInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={ROOM_TYPE_FIELD_LABELS.name}>
          {roomType.name}
        </DescriptionListItem>
        <RoomTypeTerms roomType={roomType} />
      </DescriptionList>
    </Card>
  );
}
