import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { HotelMasterInfoFields } from "@/entities/hotel-master";
import type { HotelMasterInfoField } from "@/entities/hotel-master";
import { COMMON_MESSAGES } from "@/shared/config";
import { HOTEL_MASTER_UPDATE_FORM_MESSAGES } from "../config/messages";
import type { HotelMasterUpdateStatus } from "../model/use-hotel-master-update-form";

type HotelMasterUpdateFormViewProps = {
  hotelId: number;
  fields: Record<HotelMasterInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<HotelMasterUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function HotelMasterUpdateFormView({
  hotelId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: HotelMasterUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <HotelMasterInfoFields
        fields={fields}
        loginIdHint={HOTEL_MASTER_UPDATE_FORM_MESSAGES.loginIdHint}
      />
      {alert ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-600">
            {alert}
          </p>
          <Button
            ref={reloadButtonRef}
            type="button"
            variant="secondary"
            loading={status === "reloading"}
            onClick={onReload}
          >
            {COMMON_MESSAGES.reload}
          </Button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          loading={status === "submitting"}
          disabled={status === "reloading"}
        >
          {COMMON_MESSAGES.save}
        </Button>
        <ButtonLink
          to="/hotels/$hotelId"
          params={{ hotelId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
