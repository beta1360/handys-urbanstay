import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startSession } from "@/entities/account";
import { loginAccount } from "@/shared/api";
import { useLogin } from "./use-login";

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  startSession: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  loginAccount: vi.fn(),
}));

const LOGIN_BODY = { loginId: "admin@urbanstay.com", password: "password1234" };

const ACCOUNT = { id: 1, loginId: LOGIN_BODY.loginId, name: "관리자" };

function renderUseLogin() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useLogin(), { wrapper }) };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useLogin", () => {
  it("로그인에 성공하면 받은 계정으로 로그인 상태를 시작한다", async () => {
    vi.mocked(loginAccount).mockResolvedValue({
      data: ACCOUNT,
      message: "로그인했습니다.",
    });
    const { result, queryClient } = renderUseLogin();

    await result.current.login(LOGIN_BODY);

    expect(loginAccount).toHaveBeenCalledExactlyOnceWith(LOGIN_BODY);
    expect(startSession).toHaveBeenCalledExactlyOnceWith(queryClient, ACCOUNT);
  });

  it("로그인에 실패하면 로그인 상태를 바꾸지 않고 오류를 던진다", async () => {
    const error = new Error("로그인 실패");
    vi.mocked(loginAccount).mockRejectedValue(error);
    const { result } = renderUseLogin();

    await expect(result.current.login(LOGIN_BODY)).rejects.toBe(error);
    expect(startSession).not.toHaveBeenCalled();
  });
});
