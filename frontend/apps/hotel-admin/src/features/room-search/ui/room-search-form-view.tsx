import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { SelectField } from "@repo/ui/select-field";
import type { SelectFieldOption } from "@repo/ui/select-field";
import { TextField } from "@repo/ui/text-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import {
  ROOM_FIELD_LABELS,
  ROOM_KEYWORD_MAX_LENGTH,
  ROOM_STATUS_LABELS,
  ROOM_STATUSES,
} from "@/entities/room";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_SEARCH_FORM_MESSAGES } from "../config/messages";

const STATUS_OPTIONS = [
  { value: "", label: COMMON_MESSAGES.all },
  ...ROOM_STATUSES.map((status) => ({
    value: status,
    label: ROOM_STATUS_LABELS[status],
  })),
];

type RoomSearchFormViewProps = {
  fields: Record<
    "keyword" | "status" | "roomTypeId",
    FormFieldProps & { value?: string }
  >;
  roomTypeOptions: readonly SelectFieldOption[];
  roomTypeHint: string | undefined;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RoomSearchFormView({
  fields,
  roomTypeOptions,
  roomTypeHint,
  onSubmit,
}: RoomSearchFormViewProps) {
  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2"
    >
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
      <SelectField
        label={ROOM_FIELD_LABELS.roomType}
        options={roomTypeOptions}
        hint={roomTypeHint}
        className="w-40"
        {...fields.roomTypeId}
      />
      <Button type="submit" variant="secondary">
        {COMMON_MESSAGES.search}
      </Button>
    </form>
  );
}
