import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { HotelInfoFields } from "@/entities/hotel";
import type { HotelInfoField } from "@/entities/hotel";
import { COMMON_MESSAGES } from "@/shared/config";
import type { HotelUpdateStatus } from "../model/use-hotel-update-form";

type HotelUpdateFormViewProps = {
  fields: Record<HotelInfoField, FormFieldProps>;
  alert: string | undefined;
  status: HotelUpdateStatus;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function HotelUpdateFormView({
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
          to="/hotel"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
