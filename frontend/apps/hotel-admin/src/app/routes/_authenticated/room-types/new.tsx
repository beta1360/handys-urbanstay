import { createFileRoute } from "@tanstack/react-router";
import {
  ROOM_TYPE_CREATE_MESSAGES,
  RoomTypeCreatePage,
} from "@/pages/room-type-create";

export const Route = createFileRoute("/_authenticated/room-types/new")({
  staticData: { title: ROOM_TYPE_CREATE_MESSAGES.title },
  component: RoomTypeCreatePage,
});
