import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, meQueryOptions } from "@/shared/api";
import { ensureLoggedIn, redirectIfLoggedIn } from "./login-guard";
import { LOGIN_PATH } from "./login-redirect";

const { fetchMe } = vi.hoisted(() => ({ fetchMe: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    meQueryOptions: () => ({ ...actual.meQueryOptions(), queryFn: fetchMe }),
  };
});

const ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };
const CURRENT_HREF = "/hotels?page=2";

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
const SERVER_ERROR = createApiError(500, "INTERNAL_ERROR");
const NETWORK_ERROR = new AxiosError("Network Error", AxiosError.ERR_NETWORK);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
  });
}

function createLoggedInQueryClient() {
  const queryClient = createQueryClient();
  queryClient.setQueryData(meQueryOptions().queryKey, ACCOUNT);
  return queryClient;
}

function getRejection(promise: Promise<unknown>) {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("ensureLoggedIn", () => {
  it("내 정보가 캐시에 있으면 다시 조회하지 않고 통과한다", async () => {
    await expect(
      ensureLoggedIn(createLoggedInQueryClient(), { href: CURRENT_HREF }),
    ).resolves.toBeUndefined();
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("내 정보가 없으면 조회하고 로그인 상태면 통과한다", async () => {
    fetchMe.mockResolvedValue(ACCOUNT);

    await expect(
      ensureLoggedIn(createQueryClient(), { href: CURRENT_HREF }),
    ).resolves.toBeUndefined();
    expect(fetchMe).toHaveBeenCalledOnce();
  });

  it("로그인하지 않았으면 현재 경로를 redirect에 담아 로그인 화면으로 보낸다", async () => {
    fetchMe.mockRejectedValue(UNAUTHORIZED_ERROR);

    const rejection = await getRejection(
      ensureLoggedIn(createQueryClient(), { href: CURRENT_HREF }),
    );

    expect(isRedirect(rejection)).toBe(true);
    expect(rejection).toMatchObject({
      options: { to: LOGIN_PATH, search: { redirect: CURRENT_HREF } },
    });
    expect(fetchMe).toHaveBeenCalledOnce();
  });

  it.each([
    ["서버 오류", SERVER_ERROR],
    ["네트워크 오류", NETWORK_ERROR],
  ])("%s는 다시 시도하지 않고 그대로 던진다", async (_, error) => {
    fetchMe.mockRejectedValue(error);

    await expect(
      ensureLoggedIn(createQueryClient(), { href: CURRENT_HREF }),
    ).rejects.toBe(error);
    expect(fetchMe).toHaveBeenCalledOnce();
  });
});

describe("redirectIfLoggedIn", () => {
  it("로그인 상태면 redirect 경로로 보낸다", async () => {
    const rejection = await getRejection(
      redirectIfLoggedIn(createLoggedInQueryClient(), CURRENT_HREF),
    );

    expect(isRedirect(rejection)).toBe(true);
    expect(rejection).toMatchObject({ options: { href: CURRENT_HREF } });
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it.each([
    ["로그인하지 않은", UNAUTHORIZED_ERROR],
    ["서버", SERVER_ERROR],
    ["네트워크", NETWORK_ERROR],
  ])(
    "내 정보 조회가 %s 오류면 다시 시도하지 않고 로그인 화면을 보여준다",
    async (_, error) => {
      fetchMe.mockRejectedValue(error);

      await expect(
        redirectIfLoggedIn(createQueryClient(), CURRENT_HREF),
      ).resolves.toBeUndefined();
      expect(fetchMe).toHaveBeenCalledOnce();
    },
  );
});
