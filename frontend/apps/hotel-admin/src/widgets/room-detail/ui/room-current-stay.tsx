import { useId } from "react";
import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import { TextLink } from "@repo/admin-kit/link";
import { STAY_FIELD_LABELS } from "@/entities/stay";
import type { Room } from "@/shared/api";
import { ROOM_CURRENT_STAY_MESSAGES } from "../config/messages";

type RoomCurrentStayProps = {
  currentStay: Room["currentStay"];
};

export function RoomCurrentStay({ currentStay }: RoomCurrentStayProps) {
  const titleId = useId();

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      header={
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-neutral-900">
            {ROOM_CURRENT_STAY_MESSAGES.title}
          </h2>
          {currentStay === null ? null : (
            <TextLink
              to="/stays/$stayId"
              params={{ stayId: currentStay.id }}
              className="text-sm"
            >
              {ROOM_CURRENT_STAY_MESSAGES.stayDetail}
            </TextLink>
          )}
        </div>
      }
    >
      {currentStay === null ? (
        <p className="text-sm text-neutral-500">
          {ROOM_CURRENT_STAY_MESSAGES.empty}
        </p>
      ) : (
        <DescriptionList>
          <DescriptionListItem term={STAY_FIELD_LABELS.guest}>
            <TextLink
              to="/guests/$guestId"
              params={{ guestId: currentStay.guest.id }}
            >
              {currentStay.guest.name}
            </TextLink>
          </DescriptionListItem>
          <DescriptionListItem term={STAY_FIELD_LABELS.guestPhone}>
            {currentStay.guest.phone}
          </DescriptionListItem>
          <DescriptionListItem term={STAY_FIELD_LABELS.checkInDate}>
            {currentStay.checkInDate}
          </DescriptionListItem>
          <DescriptionListItem term={STAY_FIELD_LABELS.checkOutDate}>
            {currentStay.checkOutDate}
          </DescriptionListItem>
        </DescriptionList>
      )}
    </Card>
  );
}
