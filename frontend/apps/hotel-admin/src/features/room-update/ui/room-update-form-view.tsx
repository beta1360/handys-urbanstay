import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { SelectFieldOption } from "@repo/ui/select-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { RoomInfoFields } from "@/entities/room";
import type { RoomInfoField } from "@/entities/room";
import { COMMON_MESSAGES } from "@/shared/config";
import type { RoomUpdateStatus } from "../model/use-room-update-form";

type RoomUpdateFormViewProps = {
  roomId: number;
  fields: Record<RoomInfoField, FormFieldProps & { value?: string }>;
  roomTypeOptions: readonly SelectFieldOption[];
  roomTypeHint: string | undefined;
  alert: string | undefined;
  status: Exclude<RoomUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function RoomUpdateFormView({
  roomId,
  fields,
  roomTypeOptions,
  roomTypeHint,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: RoomUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <RoomInfoFields
        fields={fields}
        roomTypeOptions={roomTypeOptions}
        roomTypeHint={roomTypeHint}
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
