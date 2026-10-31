import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from "../auth/login-redirect";
import { INDEX_REDIRECT_PATH, redirectFromIndex } from "./index-redirect";

async function setup(initialPath: string) {
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        beforeLoad: redirectFromIndex,
      }),
      createRoute({ getParentRoute: () => rootRoute, path: "rooms" }),
      createRoute({ getParentRoute: () => rootRoute, path: "login" }),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    parseSearch,
    stringifySearch,
  });
  await router.load();
  return router;
}

describe("redirectFromIndex", () => {
  it("/에 들어오면 방문 기록을 바꿔 객실 목록으로 보낸다", async () => {
    const router = await setup("/");

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe(INDEX_REDIRECT_PATH);
    });
    expect(router.history.length).toBe(1);
  });

  it("로그인 뒤 기본 이동 경로로 가도 객실 목록에 닿는다", async () => {
    const router = await setup(LOGIN_PATH);

    await router.navigate({ href: DEFAULT_LOGIN_REDIRECT });

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe(INDEX_REDIRECT_PATH);
    });
    expect(router.history.length).toBe(2);
  });
});
