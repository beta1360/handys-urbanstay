import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type AdminDetailActionsProps = {
  editAdminId?: number;
};

export function AdminDetailActions({ editAdminId }: AdminDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/admins" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editAdminId === undefined ? null : (
        <ButtonLink
          to="/admins/$adminId/edit"
          params={{ adminId: editAdminId }}
          variant="primary"
        >
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
