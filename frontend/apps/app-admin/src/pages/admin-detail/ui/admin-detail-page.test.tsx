import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_FIELD_LABELS,
  ADMIN_LOAD_MESSAGES,
  ADMIN_NOT_FOUND_MESSAGES,
  parseAdminPathParams,
  stringifyAdminPathParams,
} from "@/entities/admin";
import { API_ERROR_CODES } from "@/shared/api";
import type { Admin } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { AdminDetailPage } from "./admin-detail-page";

const { fetchAdmin } = vi.hoisted(() => ({ fetchAdmin: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchAdmin: (adminId: number) => fetchAdmin(adminId),
}));

const ADMIN: Admin = {
  id: 2,
  loginId: "kim@urbanstay.com",
  name: "김어드민",
  createdAt: "2026-10-30T15:30:00Z",
  version: 1,
};

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

function renderAdminDetailPage(initialPath = `/admins/${ADMIN.id}`) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const adminRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "admins/$adminId",
    params: {
      parse: parseAdminPathParams,
      stringify: stringifyAdminPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "admins/" }),
        adminRoute.addChildren([
          createRoute({
            getParentRoute: () => adminRoute,
            path: "/",
            component: AdminDetailPage,
          }),
        ]),
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

beforeEach(() => {
  fetchAdmin.mockResolvedValue(ADMIN);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminDetailPage", () => {
  it("이름·아이디·만든 날(한국 날짜)과 목록으로 링크를 보여준다", async () => {
    renderAdminDetailPage();

    const createdAtTerm = await screen.findByText(ADMIN_FIELD_LABELS.createdAt);
    expect(createdAtTerm.nextElementSibling).toHaveTextContent("2026-10-31");
    expect(
      screen.getByText(ADMIN_FIELD_LABELS.name).nextElementSibling,
    ).toHaveTextContent(ADMIN.name);
    expect(
      screen.getByText(ADMIN_FIELD_LABELS.loginId).nextElementSibling,
    ).toHaveTextContent(ADMIN.loginId);
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveAttribute("href", "/admins");
    expect(fetchAdmin).toHaveBeenCalledExactlyOnceWith(ADMIN.id);
  });

  it.each([
    ["잘못된 id면 요청 없이", "/admins/abc", 0],
    ["404 APP_ADMIN_NOT_FOUND면", `/admins/${ADMIN.id}`, 1],
  ])(
    "%s 찾을 수 없음과 목록으로 버튼만 보여준다",
    async (_, path, requestCount) => {
      fetchAdmin.mockRejectedValue(
        createApiError(404, API_ERROR_CODES.appAdminNotFound),
      );
      renderAdminDetailPage(path);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        ADMIN_NOT_FOUND_MESSAGES.description,
      );
      expect(screen.getAllByRole("link")).toHaveLength(1);
      expect(fetchAdmin).toHaveBeenCalledTimes(requestCount);
    },
  );

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    fetchAdmin
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(ADMIN);
    const { user } = renderAdminDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADMIN_LOAD_MESSAGES.loadFailed,
    );
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByText(ADMIN.loginId)).toBeInTheDocument();
    expect(fetchAdmin).toHaveBeenCalledTimes(2);
  });
});
