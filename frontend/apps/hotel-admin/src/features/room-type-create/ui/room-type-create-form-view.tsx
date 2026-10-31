import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { RoomTypeInfoFields } from "@/entities/room-type";
import type { RoomTypeInfoField } from "@/entities/room-type";
import { COMMON_MESSAGES } from "@/shared/config";

type RoomTypeCreateFormViewProps = {
  fields: Record<RoomTypeInfoField, FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RoomTypeCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: RoomTypeCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <RoomTypeInfoFields fields={fields} />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {COMMON_MESSAGES.create}
        </Button>
        <ButtonLink
          to="/room-types"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
