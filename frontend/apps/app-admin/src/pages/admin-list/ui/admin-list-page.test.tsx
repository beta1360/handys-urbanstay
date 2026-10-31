import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  stripSearchParams,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_FIELD_LABELS } from "@/entities/admin";
import type { AdminPage, AdminSummary } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { ADMIN_LIST_CONTENT_MESSAGES } from "@/widgets/admin-list";
import {
  ADMIN_LIST_DEFAULT_SEARCH,
  adminListSearchSchema,
} from "../model/admin-list-search";
import { AdminListPage } from "./admin-list-page";

const { fetchAdmins } = vi.hoisted(() => ({ fetchAdmins: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchAdmins: (params: Parameters<typeof actual.fetchAdmins>[0]) =>
      fetchAdmins(params),
  };
});

const ADMINS: AdminSummary[] = [
  {
    id: 2,
    loginId: "kim@urbanstay.com",
    name: "김어드민",
    createdAt: "2026-10-30T15:30:00Z",
  },
  {
    id: 1,
    loginId: "admin@urbanstay.com",
    name: "관리자",
    createdAt: "2026-10-01T00:00:00Z",
  },
];

function createAdminPage(overrides: Partial<AdminPage> = {}): AdminPage {
  return {
    items: ADMINS,
    page: 0,
    size: 10,
    totalElements: ADMINS.length,
    totalPages: 1,
    ...overrides,
  };
}

const EMPTY_ADMIN_PAGE = createAdminPage({
  items: [],
  totalElements: 0,
  totalPages: 0,
});

function adminsPath(page?: string) {
  return page === undefined ? "/admins" : `/admins?page=${page}`;
}

function renderAdminListPage(initialPath = adminsPath()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "admins/",
          validateSearch: adminListSearchSchema,
          search: {
            middlewares: [stripSearchParams(ADMIN_LIST_DEFAULT_SEARCH)],
          },
          component: AdminListPage,
        }),
        createRoute({ getParentRoute: () => layoutRoute, path: "admins/new" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "admins/$adminId",
        }),
      ]),
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
  return { router, user: userEvent.setup() };
}

function getPreviousButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.previousPage });
}

function getNextButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.nextPage });
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchAdmins.mockResolvedValue(createAdminPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminListPage 목록", () => {
  it("이름·아이디·만든 날(한국 날짜) 열의 표로 보여주고 이름은 상세 링크다", async () => {
    renderAdminListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      ADMIN_FIELD_LABELS.name,
      ADMIN_FIELD_LABELS.loginId,
      ADMIN_FIELD_LABELS.createdAt,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual([
      [ADMINS[0].name, ADMINS[0].loginId, "2026-10-31"],
      [ADMINS[1].name, ADMINS[1].loginId, "2026-10-01"],
    ]);
    expect(screen.getByRole("link", { name: ADMINS[0].name })).toHaveAttribute(
      "href",
      `/admins/${ADMINS[0].id}`,
    );
    expect(fetchAdmins).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("처음 불러오는 동안 불러오는 중 문구를 보여준다", async () => {
    fetchAdmins.mockReturnValue(new Promise<never>(() => {}));
    renderAdminListPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("계정이 없으면 빈 상태 문구를 보여주고 페이지 이동은 감춘다", async () => {
    fetchAdmins.mockResolvedValue(EMPTY_ADMIN_PAGE);
    renderAdminListPage();

    expect(
      await screen.findByText(ADMIN_LIST_CONTENT_MESSAGES.empty),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: COMMON_MESSAGES.paginationLabel,
      }),
    ).not.toBeInTheDocument();
  });

  it("불러오지 못하면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    fetchAdmins
      .mockRejectedValueOnce(new Error("서버 오류"))
      .mockResolvedValueOnce(createAdminPage());
    const { user } = renderAdminListPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADMIN_LIST_CONTENT_MESSAGES.loadFailed,
    );
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchAdmins).toHaveBeenCalledTimes(2);
  });
});

describe("AdminListPage 페이지 이동", () => {
  it("다음 버튼을 누르면 다음 페이지를 조회하고 그동안 이전 목록을 흐리게 보여준다", async () => {
    fetchAdmins
      .mockResolvedValueOnce(createAdminPage({ totalPages: 3 }))
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const { router, user } = renderAdminListPage();

    await screen.findByRole("table");
    await user.click(getNextButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(adminsPath("2"));
    });
    expect(fetchAdmins).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText(COMMON_MESSAGES.pageStatus(2, 3)),
    ).toBeInTheDocument();
  });

  it("이전 버튼을 누르면 이전 페이지를 조회하고 1페이지는 URL에 남기지 않는다", async () => {
    fetchAdmins.mockResolvedValue(createAdminPage({ page: 1, totalPages: 3 }));
    const { router, user } = renderAdminListPage(adminsPath("2"));

    await screen.findByRole("table");
    await user.click(getPreviousButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(adminsPath());
    });
    expect(fetchAdmins).toHaveBeenLastCalledWith({ page: 0 });
  });

  it.each([
    ["1페이지에서는 이전", undefined, 0, getPreviousButton, getNextButton],
    ["마지막 페이지에서는 다음", "3", 2, getNextButton, getPreviousButton],
  ])(
    "%s 버튼을 누를 수 없다",
    async (_, page, apiPage, getDisabledButton, getEnabledButton) => {
      fetchAdmins.mockResolvedValue(
        createAdminPage({ page: apiPage, totalPages: 3 }),
      );
      renderAdminListPage(adminsPath(page));

      await screen.findByRole("table");
      expect(getDisabledButton()).toBeDisabled();
      expect(getEnabledButton()).toBeEnabled();
    },
  );

  it("마지막 페이지를 넘은 페이지면 마지막 페이지로 방문 기록을 바꿔 이동한다", async () => {
    fetchAdmins
      .mockResolvedValueOnce(
        createAdminPage({ items: [], page: 49, totalPages: 2 }),
      )
      .mockResolvedValueOnce(createAdminPage({ page: 1, totalPages: 2 }));
    const { router } = renderAdminListPage(adminsPath("50"));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(adminsPath("2"));
    });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(router.history.length).toBe(1);
    expect(fetchAdmins).toHaveBeenLastCalledWith({ page: 1 });
  });

  it.each([
    ["숫자가 아니면", "abc"],
    ["1보다 작으면", "0"],
    ["100보다 크면", "101"],
  ])("URL의 page가 %s 1페이지로 조회하고 URL에서 지운다", async (_, page) => {
    const { router } = renderAdminListPage(adminsPath(page));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(adminsPath());
    expect(fetchAdmins).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });
});
