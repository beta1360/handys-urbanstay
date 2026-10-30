import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMe } from "@/entities/account";
import { useLogout } from "@/features/auth-logout";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { showToast } from "@/shared/lib/toast";
import { useAdminHeader } from "./use-admin-header";

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  useMe: vi.fn(),
}));

vi.mock("@/features/auth-logout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth-logout")>()),
  useLogout: vi.fn(),
}));

vi.mock("@/shared/lib/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib/toast")>()),
  showToast: vi.fn(),
}));

const ROUTE_TITLE = "호텔 목록";

const ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };

type LogoutResult = { message: string | undefined };

const requestLogout = vi.fn<() => Promise<LogoutResult>>();

function mockMe(account: typeof ACCOUNT | undefined) {
  vi.mocked(useMe).mockReturnValue({ data: account } as ReturnType<
    typeof useMe
  >);
}

async function renderUseAdminHeader() {
  const rootRoute = createRootRoute();
  const hotelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "hotels",
    staticData: { title: ROUTE_TITLE },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([hotelsRoute]),
    history: createMemoryHistory({ initialEntries: ["/hotels"] }),
    parseSearch,
    stringifySearch,
  });
  await router.load();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  );
  return renderHook(() => useAdminHeader(), { wrapper });
}

beforeEach(() => {
  mockMe(ACCOUNT);
  vi.mocked(useLogout).mockReturnValue({ logout: requestLogout });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("useAdminHeader", () => {
  it.each([
    ["내 정보가 있으면", "내 정보의 이름이다", ACCOUNT, ACCOUNT.name],
    ["내 정보를 아직 받지 않았으면", "없다", undefined, undefined],
  ])(
    "%s 화면 제목은 현재 라우트의 제목, 계정 이름은 %s",
    async (_, __, account, accountName) => {
      mockMe(account);

      const { result } = await renderUseAdminHeader();

      expect(result.current.title).toBe(ROUTE_TITLE);
      expect(result.current.accountName).toBe(accountName);
    },
  );

  it("로그아웃 상태는 처음에 idle, 요청 중에 pending, 요청이 실패하면 failed다", async () => {
    let rejectLogout: (error: Error) => void = () => {};
    requestLogout.mockReturnValue(
      new Promise<LogoutResult>((_, reject) => {
        rejectLogout = reject;
      }),
    );
    const { result } = await renderUseAdminHeader();

    expect(result.current.logoutStatus).toBe("idle");

    let logoutDone: Promise<void> = Promise.resolve();
    act(() => {
      logoutDone = result.current.logout();
    });

    expect(result.current.logoutStatus).toBe("pending");

    await act(async () => {
      rejectLogout(new Error("로그아웃 실패"));
      await logoutDone;
    });

    expect(result.current.logoutStatus).toBe("failed");
    expect(showToast).not.toHaveBeenCalled();
  });

  it.each([
    ["서버의 성공 문구가 있으면 성공 토스트로 보여준다", "로그아웃했습니다."],
    ["서버의 성공 문구가 없으면(401) 토스트를 띄우지 않는다", undefined],
  ])("로그아웃이 끝났을 때 %s", async (_, message) => {
    requestLogout.mockResolvedValue({ message });
    const { result } = await renderUseAdminHeader();

    await act(() => result.current.logout());

    expect(vi.mocked(showToast).mock.calls).toEqual(
      message === undefined ? [] : [[{ type: "success", message }]],
    );
  });

  it("로그아웃 요청 중에 다시 로그아웃하면 요청을 다시 보내지 않는다", async () => {
    requestLogout.mockReturnValue(new Promise<never>(() => {}));
    const { result } = await renderUseAdminHeader();

    act(() => {
      void result.current.logout();
    });
    await act(() => result.current.logout());

    expect(requestLogout).toHaveBeenCalledOnce();
    expect(result.current.logoutStatus).toBe("pending");
  });
});
