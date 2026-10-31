import { createFileRoute } from "@tanstack/react-router";
import { ROOM_CREATE_MESSAGES, RoomCreatePage } from "@/pages/room-create";

export const Route = createFileRoute("/_authenticated/rooms/new")({
  staticData: { title: ROOM_CREATE_MESSAGES.title },
  component: RoomCreatePage,
});
