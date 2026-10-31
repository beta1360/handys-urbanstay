import { createFileRoute } from "@tanstack/react-router";
import { ROOM_EDIT_MESSAGES, RoomEditPage } from "@/pages/room-edit";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/edit")({
  staticData: { title: ROOM_EDIT_MESSAGES.title },
  component: RoomEditPage,
});
