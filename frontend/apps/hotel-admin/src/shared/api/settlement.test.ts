import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import { fetchSettlement, fetchSettlementStays } from "./settlement";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getSettlement: vi.fn(),
  getSettlementStays: vi.fn(),
}));

const MONTH = "2026-11";

const SETTLEMENT = {
  month: MONTH,
  totalAmount: 450000,
  stayCount: 2,
  canceledCount: 1,
};

const SETTLEMENT_STAY = {
  id: 5,
  room: { id: 2, name: "101" },
  roomType: { id: 1, name: "스탠다드" },
  guest: { id: 3, name: "김이용" },
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  nights: 2,
  totalAmount: 200000,
  canceledAt: null,
};

const CANCELED_SETTLEMENT_STAY = {
  ...SETTLEMENT_STAY,
  id: 6,
  canceledAt: "2026-10-30T06:59:32.123456Z",
};

const SETTLEMENT_STAY_PAGE = {
  items: [SETTLEMENT_STAY, CANCELED_SETTLEMENT_STAY],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
};

function successResponse<T>(data: T) {
  return { success: true, data, message: null, error: null };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchSettlement", () => {
  it("달과 signal을 넘기고 스키마에 없는 필드를 버린 정산을 돌려준다", async () => {
    vi.mocked(generated.getSettlement).mockResolvedValue(
      successResponse({ ...SETTLEMENT, hotelId: 1 }) as never,
    );
    const { signal } = new AbortController();

    await expect(fetchSettlement({ month: MONTH }, { signal })).resolves.toEqual(
      SETTLEMENT,
    );
    expect(generated.getSettlement).toHaveBeenCalledWith(
      { month: MONTH },
      undefined,
      signal,
    );
  });

  it.each(["2026-13", "2026-1", "2026-11-01"])(
    "달이 %s면 요청을 보내지 않고 요청 검증 오류를 던진다",
    async (month) => {
      await expect(fetchSettlement({ month })).rejects.toBeInstanceOf(
        RequestValidationError,
      );
      expect(generated.getSettlement).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["success가 false면", { success: false }],
    ["data가 null이면", { data: null }],
    ["금액이 정수가 아니면", { data: { ...SETTLEMENT, totalAmount: 1.5 } }],
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, override) => {
    vi.mocked(generated.getSettlement).mockResolvedValue({
      ...successResponse(SETTLEMENT),
      ...override,
    } as never);

    await expect(fetchSettlement({ month: MONTH })).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("fetchSettlementStays", () => {
  it("달·페이지·크기와 signal을 넘겨 취소한 이용까지 담긴 페이지를 돌려준다", async () => {
    vi.mocked(generated.getSettlementStays).mockResolvedValue(
      successResponse(SETTLEMENT_STAY_PAGE),
    );
    const { signal } = new AbortController();
    const params = { month: MONTH, page: 1, size: 20 };

    await expect(fetchSettlementStays(params, { signal })).resolves.toEqual(
      SETTLEMENT_STAY_PAGE,
    );
    expect(generated.getSettlementStays).toHaveBeenCalledWith(
      params,
      undefined,
      signal,
    );
  });

  it.each([
    ["항목의 취소 시각 필드가 빠지면", { ...SETTLEMENT_STAY, canceledAt: undefined }],
    [
      "취소 시각이 ISO 시각이 아니면",
      { ...CANCELED_SETTLEMENT_STAY, canceledAt: "2026-10-30 15:59" },
    ],
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, item) => {
    vi.mocked(generated.getSettlementStays).mockResolvedValue(
      successResponse({ ...SETTLEMENT_STAY_PAGE, items: [item] }) as never,
    );

    await expect(
      fetchSettlementStays({ month: MONTH }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });
});
