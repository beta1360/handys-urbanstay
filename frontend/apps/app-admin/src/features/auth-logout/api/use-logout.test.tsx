import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { endSession } from "@/entities/account";
import { API_ERROR_CODES, logoutAccount } from "@/shared/api";
import { useLogout } from "./use-logout";

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  endSession: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  logoutAccount: vi.fn(),
}));

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

function renderUseLogout() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useLogout(), { wrapper }) };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useLogout", () => {
  it.each([
    [
      "성공하면 서버의 성공 문구와 함께",
      () => Promise.resolve({ message: "로그아웃했습니다." }),
      "로그아웃했습니다.",
    ],
    [
      "401로 실패하면 성공 문구 없이",
      () => Promise.reject(createApiError(401, API_ERROR_CODES.unauthorized)),
      undefined,
    ],
  ])(
    "로그아웃이 %s 로그인 상태를 끝낸다",
    async (_, logoutResult, message) => {
      vi.mocked(logoutAccount).mockImplementation(logoutResult);
      const { result, queryClient } = renderUseLogout();

      await expect(result.current.logout()).resolves.toEqual({ message });
      expect(endSession).toHaveBeenCalledExactlyOnceWith(queryClient);
    },
  );

  it.each([
    ["서버 오류", createApiError(500, "INTERNAL_ERROR")],
    ["네트워크 오류", new AxiosError("Network Error", AxiosError.ERR_NETWORK)],
  ])("%s면 로그인 상태를 끝내지 않고 오류를 던진다", async (_, error) => {
    vi.mocked(logoutAccount).mockRejectedValue(error);
    const { result } = renderUseLogout();

    await expect(result.current.logout()).rejects.toBe(error);
    expect(endSession).not.toHaveBeenCalled();
  });
});
