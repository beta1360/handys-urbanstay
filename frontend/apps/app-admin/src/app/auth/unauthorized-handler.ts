import { hashKey } from "@tanstack/react-query";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { API_ERROR_CODES, getApiError, meQueryOptions } from "@/shared/api";
import { LOGIN_PATH } from "./login-redirect";

type UnauthorizedHandlerTargets = {
  queryClient: QueryClient;
  router: AnyRouter;
};

function isMeQueryWithoutData(
  queryClient: QueryClient,
  queryKey: QueryKey | undefined,
) {
  const meQueryKey = meQueryOptions().queryKey;
  return (
    queryKey !== undefined &&
    hashKey(queryKey) === hashKey(meQueryKey) &&
    queryClient.getQueryData(meQueryKey) === undefined
  );
}

export function handleUnauthorizedError(
  error: unknown,
  queryKey: QueryKey | undefined,
  { queryClient, router }: UnauthorizedHandlerTargets,
) {
  if (isMeQueryWithoutData(queryClient, queryKey)) {
    return;
  }
  const { pathname, href } = router.state.location;
  if (pathname === LOGIN_PATH) {
    return;
  }
  if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
    return;
  }
  queryClient.removeQueries({
    queryKey: meQueryOptions().queryKey,
    exact: true,
  });
  void router.navigate({ to: LOGIN_PATH, search: { redirect: href } });
}
