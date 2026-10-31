import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type RoomTypeDetailActionsProps = {
  editRoomTypeId?: number;
};

export function RoomTypeDetailActions({
  editRoomTypeId,
}: RoomTypeDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink
        to="/room-types"
        activeOptions={{ exact: true }}
        className="text-sm"
      >
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editRoomTypeId === undefined ? null : (
        <ButtonLink
          to="/room-types/$roomTypeId/edit"
          params={{ roomTypeId: editRoomTypeId }}
          variant="primary"
        >
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
