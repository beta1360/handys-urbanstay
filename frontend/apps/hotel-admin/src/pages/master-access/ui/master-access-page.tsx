import { Outlet, useRouteContext } from "@tanstack/react-router";
import { MasterForbidden } from "@/shared/ui/master-forbidden";

export function MasterAccessPage() {
  const isMaster = useRouteContext({
    strict: false,
    select: (context) => context.isMaster === true,
  });

  return isMaster ? <Outlet /> : <MasterForbidden />;
}
