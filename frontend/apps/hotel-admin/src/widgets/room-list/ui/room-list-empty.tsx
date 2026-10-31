import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { ROOM_LIST_CONTENT_MESSAGES } from "../config/messages";

type RoomListEmptyProps = {
  isFiltered: boolean;
};

export function RoomListEmpty({ isFiltered }: RoomListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {isFiltered
          ? COMMON_MESSAGES.emptySearchResult
          : ROOM_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
