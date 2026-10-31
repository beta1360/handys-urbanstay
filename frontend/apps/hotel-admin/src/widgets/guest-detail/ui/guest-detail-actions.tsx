import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type GuestDetailActionsProps = {
  editGuestId?: number;
};

export function GuestDetailActions({ editGuestId }: GuestDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/guests" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editGuestId === undefined ? null : (
        <ButtonLink
          to="/guests/$guestId/edit"
          params={{ guestId: editGuestId }}
          variant="primary"
        >
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
