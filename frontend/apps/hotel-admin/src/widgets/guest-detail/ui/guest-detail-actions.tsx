import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { StayListLink } from "@/entities/stay";
import { COMMON_MESSAGES } from "@/shared/config";

type GuestDetailActionsProps = {
  guestId?: number;
};

export function GuestDetailActions({ guestId }: GuestDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/guests" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {guestId === undefined ? null : (
        <div className="flex items-center gap-4">
          <StayListLink guestId={guestId} />
          <ButtonLink
            to="/guests/$guestId/edit"
            params={{ guestId }}
            variant="primary"
          >
            {COMMON_MESSAGES.edit}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
