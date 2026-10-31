import { createFileRoute } from "@tanstack/react-router";
import {
  parseRoomPathParams,
  stringifyRoomPathParams,
} from "@/entities/room";

export const Route = createFileRoute("/_authenticated/rooms/$roomId")({
  params: {
    parse: parseRoomPathParams,
    stringify: stringifyRoomPathParams,
  },
});
