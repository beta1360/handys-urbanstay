import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  getStaysQueryPageDefault,
  getStaysQuerySizeDefault,
} from "./generated/zod";
import {
  cancelStay,
  fetchStay,
  fetchStays,
  stayListQueryKey,
  stayQueryKey,
} from "./stay";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getStays: vi.fn(),
  getStay: vi.fn(),
  cancelStay: vi.fn(),
}));

const STAY_ID = 5;

const STAY = {
  id: STAY_ID,
  room: { id: 2, name: "101" },
  guest: { id: 3, name: "김이용", phone: "010-1234-5678" },
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  guestCount: 2,
  roomRate: 100000,
  nights: 2,
  baseAmount: 200000,
  discountAmount: 0,
  totalAmount: 200000,
  cancellation: null,
};

const CANCELED_STAY = {
  ...STAY,
  cancellation: {
    canceledAt: "2026-10-30T06:59:32.123456Z",
    canceledBy: { id: 1, name: "홍길동" },
    reason: null,
  },
};

const STAY_RESPONSE = {
  success: true,
  data: STAY,
  message: null,
  error: null,
};

const STAY_PAGE = {
  items: [STAY, CANCELED_STAY],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
};

const STAY_PAGE_RESPONSE = {
  success: true,
  data: STAY_PAGE,
  message: null,
  error: null,
};

const LIST_PARAMS = {
  roomId: 2,
  guestId: 3,
  canceled: false,
  page: 1,
  size: 100,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchStays", () => {
  it("거르기 값·페이지와 signal을 넘겨 취소 정보가 담긴 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getStays).mockResolvedValue(STAY_PAGE_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchStays(LIST_PARAMS, { signal })).resolves.toEqual(
      STAY_PAGE,
    );
    expect(generated.getStays).toHaveBeenCalledWith(
      LIST_PARAMS,
      undefined,
      signal,
    );
  });

  it("빠진 page·size는 스키마 기본값을 채워 보낸다", async () => {
    vi.mocked(generated.getStays).mockResolvedValue(STAY_PAGE_RESPONSE);

    await fetchStays({});

    expect(generated.getStays).toHaveBeenCalledWith(
      { page: getStaysQueryPageDefault, size: getStaysQuerySizeDefault },
      undefined,
      undefined,
    );
  });

  it.each([
    ["page가 범위를 넘으면", { page: 100 }],
    ["size가 범위를 넘으면", { size: 101 }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, params) => {
    await expect(fetchStays(params)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getStays).not.toHaveBeenCalled();
  });

  it.each([
    ["success가 false면", { success: false }],
    ["data가 null이면", { data: null }],
    [
      "항목의 취소 정보 필드가 빠지면",
      { data: { ...STAY_PAGE, items: [{ ...STAY, cancellation: undefined }] } },
    ],
    [
      "취소 시각이 ISO 시각이 아니면",
      {
        data: {
          ...STAY_PAGE,
          items: [
            {
              ...CANCELED_STAY,
              cancellation: {
                ...CANCELED_STAY.cancellation,
                canceledAt: "2026-10-30 15:59",
              },
            },
          ],
        },
      },
    ],
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, override) => {
    vi.mocked(generated.getStays).mockResolvedValue({
      ...STAY_PAGE_RESPONSE,
      ...override,
    } as never);

    await expect(fetchStays(LIST_PARAMS)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("fetchStay", () => {
  it("이용 ID와 signal을 넘기고 스키마에 없는 필드를 버린 이용을 돌려준다", async () => {
    vi.mocked(generated.getStay).mockResolvedValue({
      ...STAY_RESPONSE,
      data: { ...CANCELED_STAY, createdAt: "2026-10-30T00:00:00Z" },
    } as never);
    const { signal } = new AbortController();

    await expect(fetchStay(STAY_ID, { signal })).resolves.toEqual(
      CANCELED_STAY,
    );
    expect(generated.getStay).toHaveBeenCalledWith(STAY_ID, undefined, signal);
  });
});

describe("쿼리 키", () => {
  it("생성된 목록·상세 쿼리 키를 쓴다", () => {
    expect(stayListQueryKey(LIST_PARAMS)).toEqual(
      generated.getGetStaysQueryKey(LIST_PARAMS),
    );
    expect(stayQueryKey(STAY_ID)).toEqual(
      generated.getGetStayQueryKey(STAY_ID),
    );
  });
});

describe("cancelStay", () => {
  const CANCEL_MESSAGE = "이용을 취소했습니다.";

  it.each([
    ["사유를 담은 본문", { reason: "고객 요청" }],
    ["빈 본문", {}],
  ])("이용 ID와 %s으로 취소하고 취소한 이용과 성공 문구를 돌려준다", async (_, body) => {
    vi.mocked(generated.cancelStay).mockResolvedValue({
      success: true,
      data: CANCELED_STAY,
      message: CANCEL_MESSAGE,
      error: null,
    });

    await expect(cancelStay(STAY_ID, body)).resolves.toEqual({
      data: CANCELED_STAY,
      message: CANCEL_MESSAGE,
    });
    expect(generated.cancelStay).toHaveBeenCalledWith(STAY_ID, body);
  });

  it("사유가 200자를 넘으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      cancelStay(STAY_ID, { reason: "가".repeat(201) }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.cancelStay).not.toHaveBeenCalled();
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.cancelStay).mockResolvedValue({
      success: true,
      data: CANCELED_STAY,
      message: null,
      error: null,
    });

    await expect(cancelStay(STAY_ID, {})).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});
