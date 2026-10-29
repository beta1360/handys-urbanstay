import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, meQueryOptions } from "@/shared/api";
import { LOGIN_PATH } from "./login-redirect";
import { handleUnauthorizedError } from "./unauthorized-handler";

const ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };
const CURRENT_HREF = "/hotels?page=2";
const OTHER_QUERY_KEY = ["hotels"];

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    error: { code, message: "요청을 처리하지 못했습니다.", fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

const UNAUTHORIZED_ERROR = createApiError(401, API_ERROR_CODES.unauthorized);

async function setup(initialPath: string, { hasMe = true } = {}) {
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/" }),
      createRoute({ getParentRoute: () => rootRoute, path: "hotels" }),
      createRoute({ getParentRoute: () => rootRoute, path: "login" }),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await router.load();
  const queryClient = new QueryClient();
  if (hasMe) {
    queryClient.setQueryData(meQueryOptions().queryKey, ACCOUNT);
  }
  return { router, queryClient };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleUnauthorizedError", () => {
  it.each([
    ["쿼리", OTHER_QUERY_KEY],
    ["뮤테이션", undefined],
    ["데이터가 있는 내 정보 쿼리", meQueryOptions().queryKey],
  ])(
    "%s가 401로 실패하면 내 정보를 지우고 현재 위치를 redirect에 담아 로그인 화면으로 보낸다",
    async (_, queryKey) => {
      const { router, queryClient } = await setup(CURRENT_HREF);

      handleUnauthorizedError(UNAUTHORIZED_ERROR, queryKey, {
        queryClient,
        router,
      });

      await vi.waitFor(() => {
        expect(router.state.location.pathname).toBe(LOGIN_PATH);
      });
      expect(router.state.location.search).toEqual({ redirect: CURRENT_HREF });
      expect(
        queryClient.getQueryData(meQueryOptions().queryKey),
      ).toBeUndefined();
    },
  );

  it("데이터가 없는 내 정보 쿼리의 401은 로그인 확인이 처리하므로 무시한다", async () => {
    const { router, queryClient } = await setup(CURRENT_HREF, {
      hasMe: false,
    });
    const navigate = vi.spyOn(router, "navigate");

    handleUnauthorizedError(UNAUTHORIZED_ERROR, meQueryOptions().queryKey, {
      queryClient,
      router,
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it("이미 로그인 화면이면 무시한다", async () => {
    const { router, queryClient } = await setup(LOGIN_PATH);
    const navigate = vi.spyOn(router, "navigate");

    handleUnauthorizedError(UNAUTHORIZED_ERROR, OTHER_QUERY_KEY, {
      queryClient,
      router,
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ["권한 없음", createApiError(403, "FORBIDDEN")],
    ["서버 오류", createApiError(500, "INTERNAL_ERROR")],
    ["네트워크 오류", new AxiosError("Network Error", AxiosError.ERR_NETWORK)],
  ])("401이 아닌 %s는 무시한다", async (_, error) => {
    const { router, queryClient } = await setup(CURRENT_HREF);
    const navigate = vi.spyOn(router, "navigate");

    handleUnauthorizedError(error, OTHER_QUERY_KEY, { queryClient, router });

    expect(navigate).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(meQueryOptions().queryKey)).toEqual(
      ACCOUNT,
    );
  });
});
