import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";
import { GUEST_DETAIL_ACTION_MESSAGES } from "../config/messages";

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
          {GUEST_DETAIL_ACTION_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
