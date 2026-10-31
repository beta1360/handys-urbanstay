import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { FormSection } from "@repo/ui/form-section";
import { TextField } from "@repo/ui/text-field";
import { TextareaField } from "@repo/ui/textarea-field";
import { ROOM_FIELD_LABELS, ROOM_INFO_MESSAGES } from "../config/messages";
import {
  ROOM_CAPACITY_RANGE,
  ROOM_FLOOR_RANGE,
} from "../model/room-info-form";
import type { RoomInfoField } from "../model/room-info-form";

const DESCRIPTION_ROWS = 5;

type RoomInfoInputElement = HTMLInputElement | HTMLTextAreaElement;

export type RoomInfoInputProps = {
  name: string;
  value?: string;
  onChange: (event: ChangeEvent<RoomInfoInputElement>) => void;
  onBlur?: (event: FocusEvent<RoomInfoInputElement>) => void;
  ref?: (element: RoomInfoInputElement | null) => void;
  error?: string;
};

type RoomInfoFieldsProps = {
  fields: Record<RoomInfoField, RoomInfoInputProps>;
};

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children}{" "}
      <span className="font-normal text-neutral-500">
        {ROOM_INFO_MESSAGES.optional}
      </span>
    </>
  );
}

export function RoomInfoFields({ fields }: RoomInfoFieldsProps) {
  return (
    <FormSection legend={ROOM_INFO_MESSAGES.legend}>
      <TextField label={ROOM_FIELD_LABELS.name} {...fields.name} />
      <TextField label={ROOM_FIELD_LABELS.type} {...fields.type} />
      <TextField
        label={ROOM_FIELD_LABELS.capacity}
        inputMode="numeric"
        hint={ROOM_INFO_MESSAGES.capacityHint(
          ROOM_CAPACITY_RANGE.min,
          ROOM_CAPACITY_RANGE.max,
        )}
        {...fields.capacity}
      />
      <TextField
        label={<OptionalLabel>{ROOM_FIELD_LABELS.floor}</OptionalLabel>}
        inputMode="numeric"
        hint={ROOM_INFO_MESSAGES.floorHint(
          ROOM_FLOOR_RANGE.min,
          ROOM_FLOOR_RANGE.max,
        )}
        {...fields.floor}
      />
      <TextField
        label={ROOM_FIELD_LABELS.checkInTime}
        type="time"
        {...fields.checkInTime}
      />
      <TextField
        label={ROOM_FIELD_LABELS.checkOutTime}
        type="time"
        {...fields.checkOutTime}
      />
      <TextareaField
        label={<OptionalLabel>{ROOM_FIELD_LABELS.description}</OptionalLabel>}
        rows={DESCRIPTION_ROWS}
        {...fields.description}
      />
    </FormSection>
  );
}
