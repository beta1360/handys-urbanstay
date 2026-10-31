import type { RoomType } from "@/shared/api";
import type { FormFieldProps } from "@/shared/lib/form";
import { ROOM_TYPE_LABELS, ROOM_TYPE_MESSAGES } from "../config/messages";

type RoomTypeOptionsProps = {
  roomTypes: RoomType[];
  field: FormFieldProps;
};

export function RoomTypeOptions({
  roomTypes,
  field: { error, ...inputProps },
}: RoomTypeOptionsProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-semibold text-gray-900">
        {ROOM_TYPE_LABELS.roomType}
      </legend>
      {roomTypes.map((roomType) => {
        const unavailable = roomType.availableCount === 0;
        return (
          <label
            key={roomType.type}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 has-checked:border-gray-900 has-disabled:bg-gray-50 has-disabled:text-gray-400"
          >
            <input
              {...inputProps}
              type="radio"
              value={roomType.type}
              disabled={unavailable}
              className="size-4 accent-gray-900"
            />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold">{roomType.type}</span>
              <span className="text-sm text-gray-500">
                {ROOM_TYPE_MESSAGES.maxGuests(roomType.maxGuests)}
              </span>
            </span>
            <span className="text-sm font-medium">
              {unavailable
                ? ROOM_TYPE_MESSAGES.unavailable
                : ROOM_TYPE_MESSAGES.available(roomType.availableCount)}
            </span>
          </label>
        );
      })}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </fieldset>
  );
}
