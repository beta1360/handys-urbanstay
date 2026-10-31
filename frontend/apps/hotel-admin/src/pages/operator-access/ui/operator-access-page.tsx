import { getRouteApi, Outlet } from "@tanstack/react-router";
import { OperatorForbidden } from "./operator-forbidden";

const operatorsRoute = getRouteApi("/_authenticated/operators");

export function OperatorAccessPage() {
  const { isMaster } = operatorsRoute.useRouteContext();

  return isMaster ? <Outlet /> : <OperatorForbidden />;
}
