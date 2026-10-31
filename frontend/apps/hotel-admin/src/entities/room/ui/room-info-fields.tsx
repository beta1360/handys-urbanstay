import type { ChangeEvent, FocusEvent, ReactNode } from "react";
import { FormSection } from "@repo/ui/form-section";
import { SelectField } from "@repo/ui/select-field";
import type { SelectFieldOption } from "@repo/ui/select-field";
import { TextField } from "@repo/ui/text-field";
import { TextareaField } from "@repo/ui/textarea-field";
import { ROOM_FIELD_LABELS, ROOM_INFO_MESSAGES } from "../config/messages";
import { ROOM_FLOOR_RANGE } from "../model/room-info-form";
import type { RoomInfoField } from "../model/room-info-form";

const DESCRIPTION_ROWS = 5;

type RoomInfoInputElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

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
  roomTypeOptions: readonly SelectFieldOption[];
  roomTypeHint: ReactNode;
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

export function RoomInfoFields({
  fields,
  roomTypeOptions,
  roomTypeHint,
}: RoomInfoFieldsProps) {
  return (
    <FormSection legend={ROOM_INFO_MESSAGES.legend}>
      <TextField label={ROOM_FIELD_LABELS.name} {...fields.name} />
      <SelectField
        label={ROOM_FIELD_LABELS.roomType}
        options={roomTypeOptions}
        hint={roomTypeHint}
        {...fields.roomTypeId}
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
      <TextareaField
        label={<OptionalLabel>{ROOM_FIELD_LABELS.description}</OptionalLabel>}
        rows={DESCRIPTION_ROWS}
        {...fields.description}
      />
    </FormSection>
  );
}
