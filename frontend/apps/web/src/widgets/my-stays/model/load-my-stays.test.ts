import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, ApiResponseError, fetchMyStays } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { loginHref } from "@/shared/lib/login-redirect";
import { SESSION_COOKIE } from "../config/session-cookie";
import { loadMyStays } from "./load-my-stays";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMyStays: vi.fn(),
}));

const SESSION_ID = "session-1";

const REDIRECT_SIGNAL = new Error("redirect");

const EMPTY_PAGE = {
  items: [],
  page: 0,
  size: 100,
  totalElements: 0,
  totalPages: 0,
};

beforeEach(() => {
  const requestCookies = new Map([
    [SESSION_COOKIE.name, SESSION_ID],
    ["_ga", "tracking"],
  ]);
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => {
      const value = requestCookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
  } as never);
  vi.mocked(redirect).mockImplementation(() => {
    throw REDIRECT_SIGNAL;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadMyStays", () => {
  it("세션 쿠키만 백엔드에 넘긴다", async () => {
    vi.mocked(fetchMyStays).mockResolvedValue(EMPTY_PAGE);

    await expect(loadMyStays()).resolves.toEqual({ status: "empty" });
    expect(fetchMyStays).toHaveBeenCalledWith(expect.anything(), {
      cookie: `${SESSION_COOKIE.name}=${SESSION_ID}`,
    });
  });

  it("백엔드가 401을 주면 내 이용으로 돌아오는 로그인 화면으로 보낸다", async () => {
    vi.mocked(fetchMyStays).mockRejectedValue(
      new ApiResponseError("getMyStays", 401, {
        code: API_ERROR_CODES.unauthorized,
        message: "로그인이 필요합니다.",
        fieldErrors: [],
      }),
    );

    await expect(loadMyStays()).rejects.toBe(REDIRECT_SIGNAL);
    expect(redirect).toHaveBeenCalledWith(loginHref(ROUTES.myStays));
  });
});
