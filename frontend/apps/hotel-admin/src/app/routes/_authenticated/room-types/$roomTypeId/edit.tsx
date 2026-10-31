import { createFileRoute } from "@tanstack/react-router";
import {
  ROOM_TYPE_EDIT_MESSAGES,
  RoomTypeEditPage,
} from "@/pages/room-type-edit";

export const Route = createFileRoute(
  "/_authenticated/room-types/$roomTypeId/edit",
)({
  staticData: { title: ROOM_TYPE_EDIT_MESSAGES.title },
  component: RoomTypeEditPage,
});
