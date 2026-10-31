import { createFileRoute } from "@tanstack/react-router";
import { redirectFromIndex } from "../../router/index-redirect";

export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: redirectFromIndex,
});
