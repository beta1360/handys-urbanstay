import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import { TextLink } from "@repo/admin-kit/link";
import type { Stay } from "@/shared/api";
import { STAY_FIELD_LABELS } from "../config/messages";
import { countNights } from "../lib/stay-period";

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
        <DescriptionListItem term={STAY_FIELD_LABELS.nights}>
          {countNights(stay)}
        </DescriptionListItem>
        <DescriptionListItem term={STAY_FIELD_LABELS.guestCount}>
          {stay.guestCount}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
