import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { GuestInfoFields } from "@/entities/guest";
import type { GuestInfoField } from "@/entities/guest";
import { COMMON_MESSAGES } from "@/shared/config";

type GuestCreateFormViewProps = {
  fields: Record<GuestInfoField, FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function GuestCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: GuestCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <GuestInfoFields fields={fields} />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {COMMON_MESSAGES.create}
        </Button>
        <ButtonLink
          to="/guests"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
