import type { Ref } from "react";
import { ROOM_TYPE_LABELS } from "@/entities/room-type";
import { formatStayPeriod, STAY_LABELS } from "@/entities/stay";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { formatWon } from "@/shared/lib/money";
import { ButtonLink } from "@/shared/ui";
import { STAY_RESERVE_LABELS } from "../config/messages";
import type { Reservation } from "../model/use-stay-reserve";
import { StayDetailList } from "./stay-detail-list";

type StayReserveCompletedProps = {
  reservation: Reservation;
  headingRef: Ref<HTMLHeadingElement>;
};

export function StayReserveCompleted({
  reservation: { stay, message },
  headingRef,
}: StayReserveCompletedProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold text-gray-900 focus:outline-none"
      >
        {message}
      </h2>
      <StayDetailList
        rows={[
          { label: STAY_RESERVE_LABELS.hotel, value: stay.hotel.name },
          { label: ROOM_TYPE_LABELS.roomType, value: stay.roomType.name },
          { label: STAY_LABELS.period, value: formatStayPeriod(stay) },
          {
            label: STAY_LABELS.guestCount,
            value: COMMON_MESSAGES.people(stay.guestCount),
          },
          {
            label: STAY_RESERVE_LABELS.reservedGuestName,
            value: stay.guest.name,
          },
          {
            label: STAY_LABELS.totalAmount,
            value: formatWon(stay.totalAmount),
          },
        ]}
      />
      <ButtonLink href={ROUTES.hotels} variant="secondary">
        {COMMON_MESSAGES.backToHotels}
      </ButtonLink>
    </div>
  );
}
