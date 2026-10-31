import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { OperatorInfoFields } from "@/entities/operator";
import type { OperatorInfoField } from "@/entities/operator";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_UPDATE_FORM_MESSAGES } from "../config/messages";
import type { OperatorUpdateStatus } from "../model/use-operator-update-form";

type OperatorUpdateFormViewProps = {
  operatorId: number;
  fields: Record<OperatorInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<OperatorUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function OperatorUpdateFormView({
  operatorId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: OperatorUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <OperatorInfoFields
        fields={fields}
        loginIdHint={OPERATOR_UPDATE_FORM_MESSAGES.loginIdHint}
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
          to="/operators/$operatorId"
          params={{ operatorId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
