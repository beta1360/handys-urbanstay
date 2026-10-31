import { useId } from "react";
import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import { TextLink } from "@repo/admin-kit/link";
import type { GuestDetail } from "@/shared/api";
import { GUEST_CURRENT_STAY_MESSAGES } from "../config/messages";

type GuestCurrentStayProps = {
  currentStay: GuestDetail["currentStay"];
};

export function GuestCurrentStay({ currentStay }: GuestCurrentStayProps) {
  const titleId = useId();

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      header={
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-neutral-900">
            {GUEST_CURRENT_STAY_MESSAGES.title}
          </h2>
          {currentStay === null ? null : (
            <TextLink
              to="/stays/$stayId"
              params={{ stayId: currentStay.id }}
              className="text-sm"
            >
              {GUEST_CURRENT_STAY_MESSAGES.stayDetail}
            </TextLink>
          )}
        </div>
      }
    >
      {currentStay === null ? (
        <p className="text-sm text-neutral-500">
          {GUEST_CURRENT_STAY_MESSAGES.empty}
        </p>
      ) : (
        <DescriptionList>
          <DescriptionListItem term={GUEST_CURRENT_STAY_MESSAGES.room}>
            <TextLink
              to="/rooms/$roomId"
              params={{ roomId: currentStay.room.id }}
            >
              {currentStay.room.name}
            </TextLink>
          </DescriptionListItem>
          <DescriptionListItem term={GUEST_CURRENT_STAY_MESSAGES.roomType}>
            {currentStay.room.roomType.name}
          </DescriptionListItem>
          <DescriptionListItem term={GUEST_CURRENT_STAY_MESSAGES.period}>
            {GUEST_CURRENT_STAY_MESSAGES.periodValue(
              currentStay.checkInDate,
              currentStay.checkOutDate,
            )}
          </DescriptionListItem>
        </DescriptionList>
      )}
    </Card>
  );
}
