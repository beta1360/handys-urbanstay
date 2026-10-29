import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, logoutAccount, meQueryOptions } from "@/shared/api";
import { APP_INFO } from "@/shared/config";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";
import { AdminLayout } from "./admin-layout";

const { fetchMe } = vi.hoisted(() => ({ fetchMe: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    logoutAccount: vi.fn(),
    meQueryOptions: () => ({ ...actual.meQueryOptions(), queryFn: fetchMe }),
  };
});

const TEST_ROUTE_TITLES = {
  home: "대시보드",
  hotels: "호텔 목록",
  hotelCreate: "호텔 등록",
} as const;

const ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };

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

function renderAdminLayout(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(meQueryOptions().queryKey, ACCOUNT);

  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "layout",
    component: AdminLayout,
  });
  const homeRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/",
    staticData: { title: TEST_ROUTE_TITLES.home },
  });
  const hotelsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels",
    staticData: { title: TEST_ROUTE_TITLES.hotels },
  });
  const hotelCreateRoute = createRoute({
    getParentRoute: () => hotelsRoute,
    path: "new",
    staticData: { title: TEST_ROUTE_TITLES.hotelCreate },
  });
  const untitledRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "untitled",
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "login",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        homeRoute,
        hotelsRoute.addChildren([hotelCreateRoute]),
        untitledRoute,
      ]),
      loginRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient };
}

function findLogoutButton() {
  return screen.findByRole("button", { name: ADMIN_LAYOUT_MESSAGES.logout });
}

beforeEach(() => {
  fetchMe.mockResolvedValue(ACCOUNT);
});

afterEach(() => {
  vi.resetAllMocks();
  focusManager.setFocused(undefined);
});

describe("AdminLayout", () => {
  it("사이드바에 앱 이름과 메뉴 내비게이션을 보여준다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("navigation", {
        name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_INFO.name)).toBeInTheDocument();
  });

  it("/ 경로에서는 홈 메뉴를 현재 페이지로 표시한다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.homeMenuLabel,
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("다른 경로에서는 홈 메뉴를 현재 페이지로 표시하지 않는다", async () => {
    renderAdminLayout("/hotels");

    expect(
      await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.homeMenuLabel,
      }),
    ).not.toHaveAttribute("aria-current");
  });

  it("현재 화면 라우트의 제목을 위쪽 제목으로 보여준다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: TEST_ROUTE_TITLES.home,
      }),
    ).toBeInTheDocument();
  });

  it("중첩된 라우트에 모두 제목이 있으면 가장 안쪽 라우트의 제목을 보여준다", async () => {
    renderAdminLayout("/hotels/new");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: TEST_ROUTE_TITLES.hotelCreate,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: TEST_ROUTE_TITLES.hotels }),
    ).not.toBeInTheDocument();
  });

  it("일치한 라우트에 제목이 없으면 위쪽 제목을 보여주지 않는다", async () => {
    renderAdminLayout("/untitled");

    await screen.findByRole("navigation", {
      name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
    });
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("위쪽에 현재 계정 이름과 로그아웃 버튼을 보여준다", async () => {
    renderAdminLayout("/");

    expect(await screen.findByText(ACCOUNT.name)).toBeInTheDocument();
    expect(await findLogoutButton()).toBeInTheDocument();
  });

  it("처음 그릴 때는 로그인 확인이 불러온 내 정보를 쓰고 다시 조회하지 않는다", async () => {
    renderAdminLayout("/");

    await screen.findByText(ACCOUNT.name);

    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("창에 다시 초점이 오면 내 정보를 다시 조회한다", async () => {
    renderAdminLayout("/");
    await screen.findByText(ACCOUNT.name);

    await act(async () => {
      focusManager.setFocused(true);
    });

    await vi.waitFor(() => {
      expect(fetchMe).toHaveBeenCalledOnce();
    });
  });
});

describe("AdminLayout 로그아웃", () => {
  it("로그아웃 요청 중에는 버튼이 로딩 상태다", async () => {
    const user = userEvent.setup();
    vi.mocked(logoutAccount).mockReturnValue(new Promise<never>(() => {}));
    renderAdminLayout("/");

    await user.click(await findLogoutButton());

    expect(await findLogoutButton()).toHaveAttribute("aria-busy", "true");
  });

  it.each([
    ["로그아웃에 성공하면", () => Promise.resolve()],
    [
      "로그아웃 요청이 401이면",
      () => Promise.reject(createApiError(401, API_ERROR_CODES.unauthorized)),
    ],
  ])(
    "%s 캐시를 비우고 로그인 화면으로 이동한다",
    async (_, logoutImplementation) => {
      const user = userEvent.setup();
      vi.mocked(logoutAccount).mockImplementation(logoutImplementation);
      const { router, queryClient } = renderAdminLayout("/hotels");

      await user.click(await findLogoutButton());

      await vi.waitFor(() => {
        expect(router.state.location.pathname).toBe("/login");
      });
      expect(router.state.location.search).toEqual({});
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    },
  );

  it("로그아웃 요청이 그 밖의 오류로 실패하면 오류 문구를 알림으로 보여주고 화면에 머문다", async () => {
    const user = userEvent.setup();
    vi.mocked(logoutAccount).mockRejectedValue(
      createApiError(500, "INTERNAL_ERROR"),
    );
    const { router, queryClient } = renderAdminLayout("/hotels");

    await user.click(await findLogoutButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADMIN_LAYOUT_MESSAGES.logoutFailed,
    );
    expect(router.state.location.pathname).toBe("/hotels");
    expect(queryClient.getQueryData(meQueryOptions().queryKey)).toEqual(
      ACCOUNT,
    );
    expect(await findLogoutButton()).not.toBeDisabled();
  });
});
