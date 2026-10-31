import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import { TextLink } from "@repo/admin-kit/link";
import type { Stay } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";
import { STAY_FIELD_LABELS } from "../config/messages";

type StayInformationProps = {
  stay: Stay;
};

export function StayInformation({ stay }: StayInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={STAY_FIELD_LABELS.room}>
          <TextLink to="/rooms/$roomId" params={{ roomId: stay.room.id }}>
            {stay.room.name}
          </TextLink>
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.guest}>
          <TextLink to="/guests/$guestId" params={{ guestId: stay.guest.id }}>
            {stay.guest.name}
          </TextLink>
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.guestPhone}>
          {stay.guest.phone}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.checkInDate}>
          {stay.checkInDate}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.checkOutDate}>
          {stay.checkOutDate}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.guestCount}>
          {stay.guestCount}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.roomRate}>
          {formatWon(stay.roomRate)}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.nights}>
          {stay.nights}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.baseAmount}>
          {formatWon(stay.baseAmount)}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.discountAmount}>
          {formatWon(stay.discountAmount)}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.totalAmount}>
          {formatWon(stay.totalAmount)}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
