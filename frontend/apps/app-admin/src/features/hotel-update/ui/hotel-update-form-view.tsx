import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import { HotelInfoFields } from "@/entities/hotel";
import type { HotelInfoField } from "@/entities/hotel";
import { COMMON_MESSAGES } from "@/shared/config";
import type { FormFieldProps } from "@/shared/lib/form";
import { ButtonLink } from "@/shared/ui";
import { HOTEL_UPDATE_FORM_MESSAGES } from "../config/messages";
import type { HotelUpdateStatus } from "../model/use-hotel-update-form";

type HotelUpdateFormViewProps = {
  hotelId: number;
  fields: Record<HotelInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<HotelUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function HotelUpdateFormView({
  hotelId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: HotelUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <HotelInfoFields fields={fields} />
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
            {HOTEL_UPDATE_FORM_MESSAGES.reload}
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
          {HOTEL_UPDATE_FORM_MESSAGES.submit}
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
