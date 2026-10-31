import { TextLink } from "@repo/admin-kit/link";
import { ROOM_TYPE_OPTION_MESSAGES } from "../config/messages";

export function RoomTypeEmptyGuide() {
  return (
    <>
      {ROOM_TYPE_OPTION_MESSAGES.empty}{" "}
      <TextLink to="/room-types/new">
        {ROOM_TYPE_OPTION_MESSAGES.create}
      </TextLink>
    </>
  );
}
