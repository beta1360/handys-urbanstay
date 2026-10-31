import { createFileRoute } from "@tanstack/react-router";
import { ROOM_DETAIL_MESSAGES, RoomDetailPage } from "@/pages/room-detail";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/")({
  staticData: { title: ROOM_DETAIL_MESSAGES.title },
  component: RoomDetailPage,
});
