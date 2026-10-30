import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMe, meQueryKey } from "@/shared/api";
import {
  endSession,
  ensureMe,
  forgetMe,
  isPendingMeQuery,
  startSession,
} from "./me-query";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMe: vi.fn(),
}));

const ACCOUNT = { id: 1, loginId: "admin@urbanstay.com", name: "관리자" };
const NEXT_ACCOUNT = { id: 2, loginId: "next@urbanstay.com", name: "다음" };
const OTHER_QUERY_KEY = ["hotels"];

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
  });
}

function createLoggedInQueryClient() {
  const queryClient = createQueryClient();
  queryClient.setQueryData(meQueryKey(), ACCOUNT);
  queryClient.setQueryData(OTHER_QUERY_KEY, ["이전 계정의 데이터"]);
  return queryClient;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("ensureMe", () => {
  it("내 정보가 캐시에 있으면 조회하지 않고 캐시 값을 돌려준다", async () => {
    await expect(ensureMe(createLoggedInQueryClient())).resolves.toEqual(
      ACCOUNT,
    );
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("내 정보가 없으면 signal을 넘겨 조회하고 캐시에 넣는다", async () => {
    vi.mocked(fetchMe).mockResolvedValue(ACCOUNT);
    const queryClient = createQueryClient();

    await expect(ensureMe(queryClient)).resolves.toEqual(ACCOUNT);
    expect(fetchMe).toHaveBeenCalledExactlyOnceWith({
      signal: expect.any(AbortSignal),
    });
    expect(queryClient.getQueryData(meQueryKey())).toEqual(ACCOUNT);
  });

  it("조회가 실패하면 다시 시도하지 않고 오류를 던진다", async () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);
    vi.mocked(fetchMe).mockRejectedValue(error);

    await expect(ensureMe(createQueryClient())).rejects.toBe(error);
    expect(fetchMe).toHaveBeenCalledOnce();
  });
});

describe("로그인 상태 캐시", () => {
  it("startSession은 캐시를 모두 비운 뒤 내 정보를 넣는다", () => {
    const queryClient = createLoggedInQueryClient();

    startSession(queryClient, NEXT_ACCOUNT);

    expect(queryClient.getQueryData(OTHER_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(meQueryKey())).toEqual(NEXT_ACCOUNT);
  });

  it("endSession은 내 정보를 포함한 캐시를 모두 비운다", () => {
    const queryClient = createLoggedInQueryClient();

    endSession(queryClient);

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("forgetMe는 내 정보만 지운다", () => {
    const queryClient = createLoggedInQueryClient();

    forgetMe(queryClient);

    expect(queryClient.getQueryData(meQueryKey())).toBeUndefined();
    expect(queryClient.getQueryData(OTHER_QUERY_KEY)).toEqual([
      "이전 계정의 데이터",
    ]);
  });
});

describe("isPendingMeQuery", () => {
  it.each([
    {
      name: "데이터가 없는 내 정보 쿼리",
      hasMe: false,
      queryKey: meQueryKey(),
      expected: true,
    },
    {
      name: "데이터가 있는 내 정보 쿼리",
      hasMe: true,
      queryKey: meQueryKey(),
      expected: false,
    },
    {
      name: "다른 쿼리",
      hasMe: false,
      queryKey: OTHER_QUERY_KEY,
      expected: false,
    },
    {
      name: "쿼리 키가 없는 뮤테이션",
      hasMe: false,
      queryKey: undefined,
      expected: false,
    },
  ])("$name이면 $expected를 돌려준다", ({ hasMe, queryKey, expected }) => {
    const queryClient = hasMe
      ? createLoggedInQueryClient()
      : createQueryClient();

    expect(isPendingMeQuery(queryClient, queryKey)).toBe(expected);
  });
});
