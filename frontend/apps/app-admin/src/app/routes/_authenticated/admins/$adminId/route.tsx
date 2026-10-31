import { createFileRoute } from "@tanstack/react-router";
import {
  parseAdminPathParams,
  stringifyAdminPathParams,
} from "@/entities/admin";

export const Route = createFileRoute("/_authenticated/admins/$adminId")({
  params: {
    parse: parseAdminPathParams,
    stringify: stringifyAdminPathParams,
  },
});
