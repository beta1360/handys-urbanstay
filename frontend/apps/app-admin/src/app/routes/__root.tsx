import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { ErrorPage } from "@/pages/error";
import { APP_INFO } from "@/shared/config";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [{ title: APP_INFO.name }],
  }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
  errorComponent: () => (
    <>
      <HeadContent />
      <ErrorPage />
    </>
  ),
});
