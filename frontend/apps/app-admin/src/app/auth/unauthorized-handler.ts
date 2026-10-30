import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { forgetMe, isPendingMeQuery } from "@/entities/account";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { LOGIN_PATH } from "./login-redirect";

type UnauthorizedHandlerTargets = {
  queryClient: QueryClient;
  router: AnyRouter;
};

export function handleUnauthorizedError(
  error: unknown,
  queryKey: QueryKey | undefined,
  { queryClient, router }: UnauthorizedHandlerTargets,
) {
  if (isPendingMeQuery(queryClient, queryKey)) {
    return;
  }
  const { pathname, href } = router.state.location;
  if (pathname === LOGIN_PATH) {
    return;
  }
  if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
    return;
  }
  forgetMe(queryClient);
  void router.navigate({ to: LOGIN_PATH, search: { redirect: href } });
}
