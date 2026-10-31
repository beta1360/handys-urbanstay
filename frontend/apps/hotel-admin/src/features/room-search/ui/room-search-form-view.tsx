import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { SelectField } from "@repo/ui/select-field";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import {
  ROOM_FIELD_LABELS,
  ROOM_KEYWORD_MAX_LENGTH,
  ROOM_STATUS_LABELS,
  ROOM_STATUSES,
} from "@/entities/room";
import { ROOM_SEARCH_FORM_MESSAGES } from "../config/messages";

const STATUS_OPTIONS = [
  { value: "", label: ROOM_SEARCH_FORM_MESSAGES.allStatuses },
  ...ROOM_STATUSES.map((status) => ({
    value: status,
    label: ROOM_STATUS_LABELS[status],
  })),
];

type RoomSearchFormViewProps = {
  fields: Record<"keyword" | "status", FormFieldProps>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RoomSearchFormView({
  fields,
  onSubmit,
}: RoomSearchFormViewProps) {
  return (
    <form role="search" onSubmit={onSubmit} className="flex items-end gap-2">
      <TextField
        label={ROOM_SEARCH_FORM_MESSAGES.keywordLabel}
        type="search"
        maxLength={ROOM_KEYWORD_MAX_LENGTH}
        className="w-80"
        {...fields.keyword}
      />
      <SelectField
        label={ROOM_FIELD_LABELS.status}
        options={STATUS_OPTIONS}
        className="w-36"
        {...fields.status}
      />
      <Button type="submit" variant="secondary">
        {ROOM_SEARCH_FORM_MESSAGES.search}
      </Button>
    </form>
  );
}
