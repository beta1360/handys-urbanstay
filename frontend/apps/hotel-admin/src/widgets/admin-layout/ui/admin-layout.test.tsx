import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import { ACCOUNT_ROLE_LABELS } from "@/entities/account";
import { API_ERROR_CODES, logoutAccount, meQueryKey } from "@/shared/api";
import type { Account } from "@/shared/api";
import { APP_INFO } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";
import { AdminLayout } from "./admin-layout";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  logoutAccount: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const TEST_ROUTE_TITLES = {
  home: "대시보드",
  rooms: "객실 목록",
  roomCreate: "객실 등록",
} as const;

const ACCOUNT: Account = {
  id: 1,
  loginId: "master@urbanstay.com",
  name: "홍길동",
  role: "MASTER",
  hotel: { id: 1, name: "어반스테이 강남" },
};

const LOGOUT_MESSAGE = "로그아웃했습니다.";

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
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

function renderAdminLayout(initialPath: string, account = ACCOUNT) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(meQueryKey(), account);

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
  const roomsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "rooms",
    staticData: { title: TEST_ROUTE_TITLES.rooms },
  });
  const roomCreateRoute = createRoute({
    getParentRoute: () => roomsRoute,
    path: "new",
    staticData: { title: TEST_ROUTE_TITLES.roomCreate },
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
        roomsRoute.addChildren([roomCreateRoute]),
        untitledRoute,
      ]),
      loginRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    parseSearch,
    stringifySearch,
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

afterEach(() => {
  vi.resetAllMocks();
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

  it.each(["/rooms", "/rooms/new"])(
    "%s 경로에서는 객실 메뉴를 현재 페이지로 표시한다",
    async (path) => {
      renderAdminLayout(path);

      const roomMenu = await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.roomMenuLabel,
      });
      expect(roomMenu).toHaveAttribute("href", "/rooms");
      expect(roomMenu).toHaveAttribute("aria-current", "page");
    },
  );

  it.each([
    [
      "MASTER",
      [
        ADMIN_LAYOUT_MESSAGES.roomMenuLabel,
        ADMIN_LAYOUT_MESSAGES.roomTypeMenuLabel,
        ADMIN_LAYOUT_MESSAGES.guestMenuLabel,
        ADMIN_LAYOUT_MESSAGES.stayMenuLabel,
        ADMIN_LAYOUT_MESSAGES.operatorMenuLabel,
      ],
    ],
    [
      "OPERATOR",
      [
        ADMIN_LAYOUT_MESSAGES.roomMenuLabel,
        ADMIN_LAYOUT_MESSAGES.guestMenuLabel,
        ADMIN_LAYOUT_MESSAGES.stayMenuLabel,
      ],
    ],
  ] as const)(
    "역할이 %s면 사이드바 메뉴를 %j 순서로 보여준다",
    async (role, menuLabels) => {
      renderAdminLayout("/", { ...ACCOUNT, role });

      const sidebar = await screen.findByRole("navigation", {
        name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
      });
      expect(
        within(sidebar)
          .getAllByRole("link")
          .map((link) => link.textContent),
      ).toEqual(menuLabels);
    },
  );

  it("다른 경로에서는 객실 메뉴를 현재 페이지로 표시하지 않는다", async () => {
    renderAdminLayout("/untitled");

    expect(
      await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.roomMenuLabel,
      }),
    ).not.toHaveAttribute("aria-current");
  });

  it.each([
    ["/", TEST_ROUTE_TITLES.home],
    ["/rooms/new", TEST_ROUTE_TITLES.roomCreate],
  ])(
    "%s 경로에서는 가장 안쪽 라우트의 제목(%s)을 위쪽 제목으로 보여준다",
    async (path, title) => {
      renderAdminLayout(path);

      expect(
        await screen.findByRole("heading", { level: 1 }),
      ).toHaveTextContent(title);
    },
  );

  it("일치한 라우트에 제목이 없으면 위쪽 제목을 보여주지 않는다", async () => {
    renderAdminLayout("/untitled");

    await screen.findByRole("navigation", {
      name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
    });
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it.each(["MASTER", "OPERATOR"] as const)(
    "위쪽에 호텔 이름, 계정 이름, 역할(%s)과 로그아웃 버튼을 보여준다",
    async (role) => {
      renderAdminLayout("/", { ...ACCOUNT, role });

      expect(await screen.findByText(ACCOUNT.hotel.name)).toBeInTheDocument();
      expect(screen.getByText(ACCOUNT.name)).toBeInTheDocument();
      expect(screen.getByText(ACCOUNT_ROLE_LABELS[role])).toBeInTheDocument();
      expect(await findLogoutButton()).toBeInTheDocument();
    },
  );
});

describe("AdminLayout 로그아웃", () => {
  it.each([
    [
      "로그아웃에 성공하면 서버의 성공 문구를 토스트로 띄우고",
      () => Promise.resolve({ message: LOGOUT_MESSAGE }),
      [[{ type: "success", message: LOGOUT_MESSAGE }]],
    ],
    [
      "로그아웃 요청이 401이면 토스트 없이",
      () => Promise.reject(createApiError(401, API_ERROR_CODES.unauthorized)),
      [],
    ],
  ])(
    "%s 캐시를 비운 뒤 로그인 화면으로 이동한다",
    async (_, logoutImplementation, toastCalls) => {
      const user = userEvent.setup();
      vi.mocked(logoutAccount).mockImplementation(logoutImplementation);
      const { router, queryClient } = renderAdminLayout("/rooms");

      await user.click(await findLogoutButton());

      await vi.waitFor(() => {
        expect(router.state.location.pathname).toBe("/login");
      });
      expect(router.state.location.search).toEqual({});
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
      expect(vi.mocked(showToast).mock.calls).toEqual(toastCalls);
    },
  );

  it("로그아웃 요청이 그 밖의 오류로 실패하면 오류 문구를 알림으로 보여주고 화면에 머문다", async () => {
    const user = userEvent.setup();
    vi.mocked(logoutAccount).mockRejectedValue(
      createApiError(500, API_ERROR_CODES.internalServerError),
    );
    const { router, queryClient } = renderAdminLayout("/rooms");

    await user.click(await findLogoutButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADMIN_LAYOUT_MESSAGES.logoutFailed,
    );
    expect(router.state.location.pathname).toBe("/rooms");
    expect(queryClient.getQueryData(meQueryKey())).toEqual(ACCOUNT);
    expect(showToast).not.toHaveBeenCalled();
    expect(await findLogoutButton()).not.toBeDisabled();
  });
});
