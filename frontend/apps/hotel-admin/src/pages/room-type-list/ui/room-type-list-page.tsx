import { ButtonLink } from "@repo/admin-kit/link";
import { RoomTypeList } from "@/widgets/room-type-list";
import { ROOM_TYPE_LIST_MESSAGES } from "../config/messages";

export function RoomTypeListPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ButtonLink to="/room-types/new" variant="primary">
          {ROOM_TYPE_LIST_MESSAGES.create}
        </ButtonLink>
      </div>
      <RoomTypeList />
    </div>
  );
}
