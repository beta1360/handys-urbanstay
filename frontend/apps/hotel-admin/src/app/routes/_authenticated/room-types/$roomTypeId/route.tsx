import { createFileRoute } from "@tanstack/react-router";
import {
  parseRoomTypePathParams,
  stringifyRoomTypePathParams,
} from "@/entities/room-type";

export const Route = createFileRoute("/_authenticated/room-types/$roomTypeId")(
  {
    params: {
      parse: parseRoomTypePathParams,
      stringify: stringifyRoomTypePathParams,
    },
  },
);
