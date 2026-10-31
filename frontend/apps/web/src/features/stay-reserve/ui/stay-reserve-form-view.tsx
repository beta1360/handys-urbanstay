import type { FormEvent } from "react";
import { ROOM_TYPE_LABELS, RoomTypeOptions } from "@/entities/room-type";
import { formatStayPeriod, STAY_LABELS } from "@/entities/stay";
import type { RoomType } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import type { FormFieldProps } from "@/shared/lib/form";
import { Button, TextField } from "@/shared/ui";
import {
  STAY_RESERVE_LABELS,
  STAY_RESERVE_MESSAGES,
} from "../config/messages";
import type { StayReserveField } from "../model/stay-reserve-form-schema";
import type { ReservationSummary } from "../model/use-stay-reserve";
import { StayDetailList } from "./stay-detail-list";

type StayReserveFormViewProps = {
  roomTypes: RoomType[];
  fields: Record<StayReserveField, FormFieldProps>;
  summary: ReservationSummary | undefined;
  formAlert: string | undefined;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function StayReserveFormView({
  roomTypes,
  fields,
  summary,
  formAlert,
  isSubmitting,
  onSubmit,
}: StayReserveFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      <RoomTypeOptions roomTypes={roomTypes} field={fields.roomType} />
      {summary ? (
        <>
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-base font-semibold text-gray-900">
              {STAY_RESERVE_MESSAGES.guestLegend}
            </legend>
            <TextField
              label={STAY_RESERVE_LABELS.guestName}
              autoComplete="name"
              {...fields["guest.name"]}
            />
            <TextField
              label={STAY_RESERVE_LABELS.guestPhone}
              type="tel"
              autoComplete="tel"
              hint={STAY_RESERVE_MESSAGES.phoneHint}
              {...fields["guest.phone"]}
            />
            <TextField
              label={STAY_RESERVE_LABELS.guestEmail}
              type="email"
              autoComplete="email"
              hint={STAY_RESERVE_MESSAGES.emailHint}
              {...fields["guest.email"]}
            />
          </fieldset>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              {STAY_RESERVE_MESSAGES.summaryTitle}
            </h2>
            <StayDetailList
              rows={[
                {
                  label: ROOM_TYPE_LABELS.roomType,
                  value: summary.roomType.type,
                },
                {
                  label: STAY_LABELS.period,
                  value: formatStayPeriod(summary.criteria),
                },
                {
                  label: STAY_LABELS.guestCount,
                  value: COMMON_MESSAGES.people(summary.criteria.guestCount),
                },
              ]}
            />
          </section>
        </>
      ) : null}
      {formAlert ? (
        <p role="alert" className="text-sm text-red-600">
          {formAlert}
        </p>
      ) : null}
      {summary ? (
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {STAY_RESERVE_MESSAGES.submit}
        </Button>
      ) : null}
    </form>
  );
}
