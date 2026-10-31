import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { GuestInfoFields } from "@/entities/guest";
import type { GuestInfoField } from "@/entities/guest";
import { COMMON_MESSAGES } from "@/shared/config";
import { GUEST_UPDATE_FORM_MESSAGES } from "../config/messages";
import type { GuestUpdateStatus } from "../model/use-guest-update-form";

type GuestUpdateFormViewProps = {
  guestId: number;
  fields: Record<GuestInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<GuestUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function GuestUpdateFormView({
  guestId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: GuestUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <GuestInfoFields fields={fields} />
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
            {GUEST_UPDATE_FORM_MESSAGES.reload}
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
          {GUEST_UPDATE_FORM_MESSAGES.submit}
        </Button>
        <ButtonLink
          to="/guests/$guestId"
          params={{ guestId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
