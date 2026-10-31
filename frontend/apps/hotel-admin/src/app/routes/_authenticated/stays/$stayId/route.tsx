import { createFileRoute } from "@tanstack/react-router";
import {
  parseStayPathParams,
  stringifyStayPathParams,
} from "@/entities/stay";

export const Route = createFileRoute("/_authenticated/stays/$stayId")({
  params: {
    parse: parseStayPathParams,
    stringify: stringifyStayPathParams,
  },
});
