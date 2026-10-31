import { createFileRoute } from "@tanstack/react-router";
import {
  parseOperatorPathParams,
  stringifyOperatorPathParams,
} from "@/entities/operator";

export const Route = createFileRoute("/_authenticated/operators/$operatorId")({
  params: {
    parse: parseOperatorPathParams,
    stringify: stringifyOperatorPathParams,
  },
});
