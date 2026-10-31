import type { ChangeEvent, FocusEvent } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import { formatWon } from "@/shared/lib/money";
import {
  ROOM_TYPE_FIELD_LABELS,
  ROOM_TYPE_INFO_MESSAGES,
} from "../config/messages";
import {
  ROOM_TYPE_CAPACITY_RANGE,
  ROOM_TYPE_RATE_RANGE,
} from "../model/room-type-info-form";
import type { RoomTypeInfoField } from "../model/room-type-info-form";

export type RoomTypeInfoInputProps = {
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: (element: HTMLInputElement | null) => void;
  error?: string;
};

type RoomTypeInfoFieldsProps = {
  fields: Record<RoomTypeInfoField, RoomTypeInfoInputProps>;
};

export function RoomTypeInfoFields({ fields }: RoomTypeInfoFieldsProps) {
  return (
    <FormSection legend={ROOM_TYPE_INFO_MESSAGES.legend}>
      <TextField label={ROOM_TYPE_FIELD_LABELS.name} {...fields.name} />
      <TextField
        label={ROOM_TYPE_FIELD_LABELS.capacity}
        inputMode="numeric"
        hint={ROOM_TYPE_INFO_MESSAGES.capacityHint(
          ROOM_TYPE_CAPACITY_RANGE.min,
          ROOM_TYPE_CAPACITY_RANGE.max,
        )}
        {...fields.capacity}
      />
      <TextField
        label={ROOM_TYPE_FIELD_LABELS.roomRate}
        inputMode="numeric"
        hint={ROOM_TYPE_INFO_MESSAGES.roomRateHint(
          formatWon(ROOM_TYPE_RATE_RANGE.min),
          formatWon(ROOM_TYPE_RATE_RANGE.max),
        )}
        {...fields.roomRate}
      />
      <TextField
        label={ROOM_TYPE_FIELD_LABELS.checkInTime}
        type="time"
        {...fields.checkInTime}
      />
      <TextField
        label={ROOM_TYPE_FIELD_LABELS.checkOutTime}
        type="time"
        {...fields.checkOutTime}
      />
    </FormSection>
  );
}
