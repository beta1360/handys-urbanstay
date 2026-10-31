import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { RoomInfoFields } from "@/entities/room";
import type { RoomInfoField } from "@/entities/room";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_UPDATE_FORM_MESSAGES } from "../config/messages";
import type { RoomUpdateStatus } from "../model/use-room-update-form";

type RoomUpdateFormViewProps = {
  roomId: number;
  fields: Record<RoomInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<RoomUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function RoomUpdateFormView({
  roomId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: RoomUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <RoomInfoFields fields={fields} />
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
            {ROOM_UPDATE_FORM_MESSAGES.reload}
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
          {ROOM_UPDATE_FORM_MESSAGES.submit}
        </Button>
        <ButtonLink
          to="/rooms/$roomId"
          params={{ roomId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
