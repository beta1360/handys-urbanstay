import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Guest } from "@/shared/api";
import { GUEST_FIELD_LABELS } from "../config/messages";

type GuestInformationProps = {
  guest: Guest;
};

export function GuestInformation({ guest }: GuestInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={GUEST_FIELD_LABELS.name}>
          {guest.name}
        </DescriptionListItem>
        <DescriptionListItem term={GUEST_FIELD_LABELS.phone}>
          {guest.phone}
        </DescriptionListItem>
        <DescriptionListItem term={GUEST_FIELD_LABELS.email}>
          {guest.email}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
