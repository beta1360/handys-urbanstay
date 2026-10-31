import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_DETAIL_ACTION_MESSAGES } from "../config/messages";

type RoomDetailActionsProps = {
  editRoomId?: number;
};

export function RoomDetailActions({ editRoomId }: RoomDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/rooms" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editRoomId === undefined ? null : (
        <ButtonLink
          to="/rooms/$roomId/edit"
          params={{ roomId: editRoomId }}
          variant="primary"
        >
          {ROOM_DETAIL_ACTION_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
