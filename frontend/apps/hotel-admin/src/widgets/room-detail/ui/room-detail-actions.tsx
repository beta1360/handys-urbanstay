import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { StayListLink } from "@/entities/stay";
import { COMMON_MESSAGES } from "@/shared/config";

type RoomDetailActionsProps = {
  roomId?: number;
  canEdit?: boolean;
};

export function RoomDetailActions({ roomId, canEdit }: RoomDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/rooms" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {roomId === undefined ? null : (
        <div className="flex items-center gap-4">
          <StayListLink roomId={roomId} />
          {canEdit ? (
            <ButtonLink
              to="/rooms/$roomId/edit"
              params={{ roomId }}
              variant="primary"
            >
              {COMMON_MESSAGES.edit}
            </ButtonLink>
          ) : null}
        </div>
      )}
    </div>
  );
}
