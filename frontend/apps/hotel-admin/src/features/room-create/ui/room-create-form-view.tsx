import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { RoomInfoFields } from "@/entities/room";
import type { RoomInfoField } from "@/entities/room";
import { COMMON_MESSAGES } from "@/shared/config";

type RoomCreateFormViewProps = {
  fields: Record<RoomInfoField, FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RoomCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: RoomCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <RoomInfoFields fields={fields} />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {COMMON_MESSAGES.create}
        </Button>
        <ButtonLink
          to="/rooms"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
