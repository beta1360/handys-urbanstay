import { createFileRoute } from "@tanstack/react-router";
import { checkMasterAccess } from "../../../auth/master-guard";

export const Route = createFileRoute("/_authenticated/rooms")({
  beforeLoad: ({ context }) => checkMasterAccess(context.queryClient),
});
