import { createFileRoute } from "@tanstack/react-router";
import { MasterAccessPage } from "@/pages/master-access";
import { checkMasterAccess } from "../../../auth/master-guard";

export const Route = createFileRoute("/_authenticated/operators")({
  beforeLoad: ({ context }) => checkMasterAccess(context.queryClient),
  component: MasterAccessPage,
});
