import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { SelectField } from "@repo/ui/select-field";
import type { SelectFieldOption } from "@repo/ui/select-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { STAY_CANCELED_LABELS, STAY_FIELD_LABELS } from "@/entities/stay";
import { COMMON_MESSAGES } from "@/shared/config";
import { STAY_SEARCH_FORM_MESSAGES } from "../config/messages";

const ALL_OPTION = { value: "", label: STAY_SEARCH_FORM_MESSAGES.all };

const CANCELED_OPTIONS = [
  ALL_OPTION,
  { value: String(false), label: STAY_CANCELED_LABELS.false },
  { value: String(true), label: STAY_CANCELED_LABELS.true },
];

type StaySearchFormViewProps = {
  fields: Record<"roomId" | "canceled", FormFieldProps & { value?: string }>;
  roomOptions: readonly SelectFieldOption[];
  roomHint: string | undefined;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function StaySearchFormView({
  fields,
  roomOptions,
  roomHint,
  onSubmit,
}: StaySearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <SelectField
        label={STAY_FIELD_LABELS.room}
        options={[ALL_OPTION, ...roomOptions]}
        hint={roomHint}
        className="w-48"
        {...fields.roomId}
      />
      <SelectField
        label={STAY_FIELD_LABELS.canceled}
        options={CANCELED_OPTIONS}
        className="w-36"
        {...fields.canceled}
      />
      <Button type="submit" variant="secondary">
        {COMMON_MESSAGES.search}
      </Button>
    </form>
  );
}
