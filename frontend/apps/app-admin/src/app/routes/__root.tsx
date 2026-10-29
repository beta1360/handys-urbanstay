import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { APP_INFO } from "@/shared/config";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: APP_INFO.name }],
  }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
});
