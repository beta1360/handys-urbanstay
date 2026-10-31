import type { FormEvent } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { HotelMasterPasswordField } from "@/entities/hotel-master";
import { HOTEL_MASTER_PASSWORD_RESET_MESSAGES } from "../config/messages";
import type { HotelMasterPasswordResetStatus } from "../model/use-hotel-master-password-reset-form";

type HotelMasterPasswordResetViewProps = {
  fields: Record<"password", FormFieldProps>;
  status: HotelMasterPasswordResetStatus;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function HotelMasterPasswordResetView({
  fields,
  status,
  onSubmit,
}: HotelMasterPasswordResetViewProps) {
  return (
    <form
      noValidate
      aria-label={HOTEL_MASTER_PASSWORD_RESET_MESSAGES.submit}
      onSubmit={onSubmit}
      className="flex flex-col gap-4 border-t border-neutral-200 pt-6"
    >
      <HotelMasterPasswordField
        label={HOTEL_MASTER_PASSWORD_RESET_MESSAGES.passwordLabel}
        hint={HOTEL_MASTER_PASSWORD_RESET_MESSAGES.passwordHint}
        {...fields.password}
      />
      <div>
        <Button
          type="submit"
          variant="secondary"
          loading={status === "submitting"}
        >
          {HOTEL_MASTER_PASSWORD_RESET_MESSAGES.submit}
        </Button>
      </div>
    </form>
  );
}
