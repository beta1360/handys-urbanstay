import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { HotelInfoFields } from "@/entities/hotel";
import { COMMON_MESSAGES } from "@/shared/config";
import { HOTEL_CREATE_FORM_MESSAGES } from "../config/messages";
import type { HotelCreateField } from "../model/hotel-create-form-schema";
import { MasterAccountFields } from "./master-account-fields";

type HotelCreateFormViewProps = {
  fields: Record<HotelCreateField, FormFieldProps>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function HotelCreateFormView({
  fields,
  isSubmitting,
  onSubmit,
}: HotelCreateFormViewProps) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-4"
    >
      <HotelInfoFields fields={fields} />
      <MasterAccountFields fields={fields} />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {HOTEL_CREATE_FORM_MESSAGES.submit}
        </Button>
        <ButtonLink
          to="/hotels"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
