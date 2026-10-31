import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import { FormSection } from "@repo/ui/form-section";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { ButtonLink } from "@repo/admin-kit/link";
import { ADMIN_INFO_MESSAGES, AdminNameField } from "@/entities/admin";
import type { AdminInfoField } from "@/entities/admin";
import { COMMON_MESSAGES } from "@/shared/config";
import type { AdminUpdateStatus } from "../model/use-admin-update-form";

type AdminUpdateFormViewProps = {
  adminId: number;
  fields: Record<AdminInfoField, FormFieldProps>;
  alert: string | undefined;
  status: Exclude<AdminUpdateStatus, "notFound">;
  reloadButtonRef: Ref<HTMLButtonElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReload: () => void;
};

export function AdminUpdateFormView({
  adminId,
  fields,
  alert,
  status,
  reloadButtonRef,
  onSubmit,
  onReload,
}: AdminUpdateFormViewProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormSection legend={ADMIN_INFO_MESSAGES.legend}>
        <AdminNameField {...fields.name} />
      </FormSection>
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
          to="/admins/$adminId"
          params={{ adminId }}
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
