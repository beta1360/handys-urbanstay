import { createFileRoute } from "@tanstack/react-router";
import {
  parseGuestPathParams,
  stringifyGuestPathParams,
} from "@/entities/guest";

export const Route = createFileRoute("/_authenticated/guests/$guestId")({
  params: {
    parse: parseGuestPathParams,
    stringify: stringifyGuestPathParams,
  },
});
