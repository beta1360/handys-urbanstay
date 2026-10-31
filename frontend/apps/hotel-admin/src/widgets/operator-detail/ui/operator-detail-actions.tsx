import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type OperatorDetailActionsProps = {
  editOperatorId?: number;
};

export function OperatorDetailActions({
  editOperatorId,
}: OperatorDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink
        to="/operators"
        activeOptions={{ exact: true }}
        className="text-sm"
      >
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editOperatorId === undefined ? null : (
        <ButtonLink
          to="/operators/$operatorId/edit"
          params={{ operatorId: editOperatorId }}
          variant="primary"
        >
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
