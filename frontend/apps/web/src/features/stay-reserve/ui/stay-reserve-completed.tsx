import type { Ref } from "react";
import { countNights, STAY_LABELS, STAY_MESSAGES } from "@/entities/stay";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { STAY_RESERVE_COMPLETED_LABELS } from "../config/messages";
import type { Reservation } from "../model/use-stay-reserve";

type StayReserveCompletedProps = {
  reservation: Reservation;
  headingRef: Ref<HTMLHeadingElement>;
};

export function StayReserveCompleted({
  reservation: { stay, message },
  headingRef,
}: StayReserveCompletedProps) {
  const rows = [
    { label: STAY_RESERVE_COMPLETED_LABELS.hotel, value: stay.hotel.name },
    { label: STAY_RESERVE_COMPLETED_LABELS.room, value: stay.room.name },
    {
      label: STAY_LABELS.period,
      value: `${STAY_MESSAGES.period(stay.checkInDate, stay.checkOutDate)} (${STAY_MESSAGES.nights(countNights(stay))})`,
    },
    {
      label: STAY_LABELS.guestCount,
      value: COMMON_MESSAGES.people(stay.guestCount),
    },
    { label: STAY_RESERVE_COMPLETED_LABELS.guestName, value: stay.guest.name },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold text-gray-900 focus:outline-none"
      >
        {message}
      </h1>
      <dl className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="shrink-0 text-gray-500">{label}</dt>
            <dd className="text-right font-medium text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      <ButtonLink href={ROUTES.hotels} variant="secondary">
        {COMMON_MESSAGES.backToHotels}
      </ButtonLink>
    </div>
  );
}
