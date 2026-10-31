import type { FormEvent } from "react";
import { STAY_LABELS } from "@/entities/stay";
import type { StayCriteriaField } from "@/entities/stay";
import type { FormFieldProps } from "@/shared/lib/form";
import { Button, TextField } from "@/shared/ui";
import { STAY_SEARCH_MESSAGES } from "../config/messages";

type StaySearchFormViewProps = {
  fields: Record<StayCriteriaField, FormFieldProps>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function StaySearchFormView({
  fields,
  onSubmit,
}: StaySearchFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-base font-semibold text-gray-900">
          {STAY_SEARCH_MESSAGES.legend}
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
          hint={STAY_SEARCH_MESSAGES.guestCountHint}
          {...fields.guestCount}
        />
      </fieldset>
      <Button type="submit" variant="secondary">
        {STAY_SEARCH_MESSAGES.submit}
      </Button>
    </form>
  );
}
