import { createFileRoute } from "@tanstack/react-router";
import {
  ROOM_TYPE_LIST_MESSAGES,
  RoomTypeListPage,
} from "@/pages/room-type-list";

export const Route = createFileRoute("/_authenticated/room-types/")({
  staticData: { title: ROOM_TYPE_LIST_MESSAGES.title },
  component: RoomTypeListPage,
});
