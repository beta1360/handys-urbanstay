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
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  ADMIN_FIELD_LABELS,
  ADMIN_NOT_FOUND_MESSAGES,
  parseAdminPathParams,
  stringifyAdminPathParams,
} from "@/entities/admin";
import {
  adminQueryKey,
  API_ERROR_CODES,
  meQueryKey,
  updateAdmin,
} from "@/shared/api";
import type { Admin } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { AdminEditPage } from "./admin-edit-page";

const { fetchAdmin } = vi.hoisted(() => ({ fetchAdmin: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  updateAdmin: vi.fn(),
  fetchAdmin: (adminId: number) => fetchAdmin(adminId),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const DETAIL_PAGE_TEXT = "어드민 계정 상세 화면";

const UPDATE_MESSAGE = "어드민 계정 이름을 수정했습니다.";

const MODIFIED_MESSAGE =
  "다른 사용자가 먼저 수정했습니다. 다시 불러온 뒤 시도해 주세요.";

const ADMIN: Admin = {
  id: 2,
  loginId: "kim@urbanstay.com",
  name: "김어드민",
  createdAt: "2026-10-30T15:30:00Z",
  version: 1,
};

const LATEST_ADMIN: Admin = { ...ADMIN, name: "최신 이름", version: 2 };

const OTHER_ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };

function createApiError(status: number, code: string, message = "서버 문구") {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderAdminEditPage(adminId = String(ADMIN.id)) {
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
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => adminRoute,
            path: "edit",
            component: AdminEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/admins/${adminId}`, `/admins/${adminId}/edit`],
      initialIndex: 1,
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient, user: userEvent.setup() };
}

async function renderLoadedPage() {
  const rendered = renderAdminEditPage();
  await screen.findByLabelText(ADMIN_FIELD_LABELS.name);
  return rendered;
}

function getNameField() {
  return screen.getByLabelText(ADMIN_FIELD_LABELS.name);
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.save });
}

async function replaceName(user: UserEvent, value: string) {
  await user.clear(getNameField());
  if (value !== "") {
    await user.paste(value);
  }
}

beforeEach(() => {
  fetchAdmin.mockResolvedValue(ADMIN);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminEditPage 불러오기", () => {
  it("이름 칸만 조회 값으로 채우고 취소는 상세로 가는 링크다", async () => {
    await renderLoadedPage();

    expect(getNameField()).toHaveValue(ADMIN.name);
    expect(screen.getAllByRole("textbox")).toEqual([getNameField()]);
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", `/admins/${ADMIN.id}`);
    expect(fetchAdmin).toHaveBeenCalledExactlyOnceWith(ADMIN.id);
  });

  it.each([
    ["잘못된 id면 요청 없이", "abc", 0],
    ["404 APP_ADMIN_NOT_FOUND면", String(ADMIN.id), 1],
  ])("%s 찾을 수 없음을 보여준다", async (_, adminId, requestCount) => {
    fetchAdmin.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.appAdminNotFound),
    );
    renderAdminEditPage(adminId);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ADMIN_NOT_FOUND_MESSAGES.description,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(fetchAdmin).toHaveBeenCalledTimes(requestCount);
  });
});

describe("AdminEditPage 저장", () => {
  it("이름을 비우고 저장하면 필수 오류를 보여주고 요청하지 않는다", async () => {
    const { user } = await renderLoadedPage();

    await replaceName(user, "   ");
    await user.click(getSubmitButton());

    expect(getNameField()).toHaveAccessibleDescription(
      FORM_VALIDATION_MESSAGES.required,
    );
    expect(getNameField()).toHaveFocus();
    expect(updateAdmin).not.toHaveBeenCalled();
  });

  it("앞뒤 공백을 지운 이름과 처음 채운 version으로 저장하고, 성공하면 서버 문구 토스트를 띄우고 캐시를 바꾼 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    const savedAdmin = { ...ADMIN, name: "바꾼 이름", version: 2 };
    vi.mocked(updateAdmin).mockResolvedValue({
      data: savedAdmin,
      message: UPDATE_MESSAGE,
    });
    const { router, queryClient, user } = await renderLoadedPage();

    await replaceName(user, ` ${savedAdmin.name} `);
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(updateAdmin).toHaveBeenCalledExactlyOnceWith(ADMIN.id, {
      name: savedAdmin.name,
      version: ADMIN.version,
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: UPDATE_MESSAGE,
    });
    expect(queryClient.getQueryData(adminQueryKey(ADMIN.id))).toEqual(
      savedAdmin,
    );
    expect(router.state.location.href).toBe(`/admins/${ADMIN.id}`);
    expect(router.history.length).toBe(2);
  });

  it.each([
    ["내 계정이면 내 정보를 다시 불러오게 한다", ADMIN, true],
    ["다른 계정이면 내 정보를 그대로 둔다", OTHER_ACCOUNT, false],
  ])("%s", async (_, me, isInvalidated) => {
    vi.mocked(updateAdmin).mockResolvedValue({
      data: ADMIN,
      message: UPDATE_MESSAGE,
    });
    const { queryClient, user } = await renderLoadedPage();
    queryClient.setQueryData(meQueryKey(), {
      id: me.id,
      loginId: me.loginId,
      name: me.name,
    });

    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(queryClient.getQueryState(meQueryKey())?.isInvalidated).toBe(
      isInvalidated,
    );
  });

  it("그 밖의 오류 응답이면 서버 문구를 오류 토스트로 보여주고 입력한 내용은 그대로 둔다", async () => {
    vi.mocked(updateAdmin).mockRejectedValue(
      createApiError(500, "INTERNAL_SERVER_ERROR", "서버 오류 문구"),
    );
    const { user } = await renderLoadedPage();

    await replaceName(user, "바꾼 이름");
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: "서버 오류 문구",
      });
    });
    expect(getNameField()).toHaveValue("바꾼 이름");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("AdminEditPage 수정 충돌", () => {
  it("먼저 수정됐다는 응답이면 알림과 최신 내용 불러오기 버튼을 보여주고, 누르면 최신 값과 version으로 다시 채운 뒤 새 version으로 저장한다", async () => {
    vi.mocked(updateAdmin)
      .mockRejectedValueOnce(
        createApiError(409, API_ERROR_CODES.appAdminModified, MODIFIED_MESSAGE),
      )
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const { user } = await renderLoadedPage();

    await replaceName(user, "입력한 이름");
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MODIFIED_MESSAGE,
    );
    expect(showToast).not.toHaveBeenCalled();
    fetchAdmin.mockResolvedValue(LATEST_ADMIN);

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.reload }),
    );

    await vi.waitFor(() => {
      expect(getNameField()).toHaveValue(LATEST_ADMIN.name);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getNameField()).toHaveFocus();
    });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateAdmin).mock.lastCall).toEqual([
      ADMIN.id,
      { name: LATEST_ADMIN.name, version: LATEST_ADMIN.version },
    ]);
  });
});
