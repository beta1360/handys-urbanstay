import type { FormEvent } from "react";
import { STAY_LABELS } from "@/entities/stay";
import type { FormFieldProps } from "@/shared/lib/form";
import { Button, TextField } from "@/shared/ui";
import {
  STAY_RESERVE_LABELS,
  STAY_RESERVE_MESSAGES,
} from "../config/messages";
import type { StayReserveField } from "../model/stay-reserve-form-schema";

type StayReserveFormViewProps = {
  capacity: number;
  fields: Record<StayReserveField, FormFieldProps>;
  formAlert: string | undefined;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const FIELDSET_CLASS_NAME = "flex flex-col gap-4";

const LEGEND_CLASS_NAME = "mb-3 text-base font-semibold text-gray-900";

export function StayReserveFormView({
  capacity,
  fields,
  formAlert,
  isSubmitting,
  onSubmit,
}: StayReserveFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset className={FIELDSET_CLASS_NAME}>
        <legend className={LEGEND_CLASS_NAME}>
          {STAY_RESERVE_MESSAGES.periodLegend}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={STAY_LABELS.checkInDate}
            type="date"
            {...fields.checkInDate}
          />
          <TextField
            label={STAY_LABELS.checkOutDate}
            type="date"
            {...fields.checkOutDate}
          />
        </div>
        <TextField
          label={STAY_LABELS.guestCount}
          inputMode="numeric"
          hint={STAY_RESERVE_MESSAGES.guestCountHint(capacity)}
          {...fields.guestCount}
        />
      </fieldset>
      <fieldset className={FIELDSET_CLASS_NAME}>
        <legend className={LEGEND_CLASS_NAME}>
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
      {formAlert ? (
        <p role="alert" className="text-sm text-red-600">
          {formAlert}
        </p>
      ) : null}
      <Button type="submit" variant="primary" loading={isSubmitting}>
        {STAY_RESERVE_MESSAGES.submit}
      </Button>
    </form>
  );
}
