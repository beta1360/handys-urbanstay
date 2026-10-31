import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import {
  ROOM_LIST_DEFAULT_SEARCH,
  ROOM_LIST_MESSAGES,
  RoomListPage,
  roomListSearchSchema,
} from "@/pages/room-list";

export const Route = createFileRoute("/_authenticated/rooms/")({
  validateSearch: roomListSearchSchema,
  search: {
    middlewares: [stripSearchParams(ROOM_LIST_DEFAULT_SEARCH)],
  },
  staticData: { title: ROOM_LIST_MESSAGES.title },
  component: RoomListPage,
});
