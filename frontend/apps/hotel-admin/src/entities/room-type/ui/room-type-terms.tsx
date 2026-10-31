import { DescriptionListItem } from "@repo/ui/description-list";
import type { RoomType } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";
import { ROOM_TYPE_FIELD_LABELS } from "../config/messages";

type RoomTypeTermsProps = {
  roomType: Pick<
    RoomType,
    "capacity" | "roomRate" | "checkInTime" | "checkOutTime"
  >;
};

export function RoomTypeTerms({ roomType }: RoomTypeTermsProps) {
  return (
    <>
      <DescriptionListItem term={ROOM_TYPE_FIELD_LABELS.capacity}>
        {roomType.capacity}
      </DescriptionListItem>
      <DescriptionListItem term={ROOM_TYPE_FIELD_LABELS.roomRate}>
        {formatWon(roomType.roomRate)}
      </DescriptionListItem>
      <DescriptionListItem term={ROOM_TYPE_FIELD_LABELS.checkInTime}>
        {roomType.checkInTime}
      </DescriptionListItem>
      <DescriptionListItem term={ROOM_TYPE_FIELD_LABELS.checkOutTime}>
        {roomType.checkOutTime}
      </DescriptionListItem>
    </>
  );
}
