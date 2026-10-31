import { createFileRoute } from "@tanstack/react-router";
import {
  ROOM_TYPE_DETAIL_MESSAGES,
  RoomTypeDetailPage,
} from "@/pages/room-type-detail";

export const Route = createFileRoute(
  "/_authenticated/room-types/$roomTypeId/",
)({
  staticData: { title: ROOM_TYPE_DETAIL_MESSAGES.title },
  component: RoomTypeDetailPage,
});
