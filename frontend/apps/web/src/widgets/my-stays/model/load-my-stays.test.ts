import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_ERROR_CODES,
  ApiResponseError,
  fetchMyStays,
  MY_STAY_PERIOD,
} from "@/shared/api";
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

const SESSION_HEADER = `${SESSION_COOKIE.name}=${SESSION_ID}`;

const REDIRECT_SIGNAL = new Error("redirect");

const FIRST_UPCOMING = { period: MY_STAY_PERIOD.UPCOMING, page: 0, size: 10 };

const FIRST_PAST = { period: MY_STAY_PERIOD.PAST, page: 0, size: 10 };

function stay(id: number) {
  return {
    id,
    hotel: { id: 1, name: "어반스테이 강남" },
    roomType: { id: 2, name: "스탠다드" },
    checkInDate: "2026-11-05",
    checkOutDate: "2026-11-07",
    guestCount: 2,
    roomRate: 90000,
    nights: 2,
    baseAmount: 180000,
    discountAmount: 0,
    totalAmount: 180000,
    canceledAt: null,
  };
}

function stayPage(ids: number[]) {
  return {
    items: ids.map(stay),
    page: 0,
    size: 10,
    totalElements: ids.length,
    totalPages: ids.length === 0 ? 0 : 1,
  };
}

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
  it("세션 쿠키만 넘겨 지금·앞으로의 이용 첫 10건을 읽고, 있으면 그 페이지만 넘긴다", async () => {
    vi.mocked(fetchMyStays).mockResolvedValue(stayPage([1, 2]));

    const state = await loadMyStays();

    expect(state.status === "ready" ? state.initialPages : state).toEqual([
      expect.objectContaining({ items: [stay(1), stay(2)] }),
    ]);
    expect(fetchMyStays).toHaveBeenCalledTimes(1);
    expect(fetchMyStays).toHaveBeenCalledWith(FIRST_UPCOMING, {
      cookie: SESSION_HEADER,
    });
  });

  it("지금·앞으로의 이용이 없으면 지난 이용 첫 10건까지 읽어 함께 넘긴다", async () => {
    vi.mocked(fetchMyStays)
      .mockResolvedValueOnce(stayPage([]))
      .mockResolvedValueOnce(stayPage([3]));

    const state = await loadMyStays();

    expect(state.status === "ready" ? state.initialPages : state).toEqual([
      expect.objectContaining({ items: [] }),
      expect.objectContaining({ items: [stay(3)] }),
    ]);
    expect(fetchMyStays).toHaveBeenLastCalledWith(FIRST_PAST, {
      cookie: SESSION_HEADER,
    });
  });

  it("지금·앞으로와 지난 이용이 모두 없으면 빈 상태를 돌려준다", async () => {
    vi.mocked(fetchMyStays).mockResolvedValue(stayPage([]));

    await expect(loadMyStays()).resolves.toEqual({ status: "empty" });
    expect(fetchMyStays).toHaveBeenCalledTimes(2);
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
