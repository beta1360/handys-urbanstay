import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, getApiError } from "./api-error";
import * as generated from "./generated";
import { createStay, fetchMyStays } from "./stay";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  createStay: vi.fn(),
  getMyStays: vi.fn(),
}));

const HEADERS = new Headers();

const BODY = {
  hotelId: 3,
  roomTypeId: 2,
  checkInDate: "2026-11-04",
  checkOutDate: "2026-11-06",
  guestCount: 2,
};

const RESERVED_STAY = {
  id: 11,
  hotel: { id: 3, name: "어반스테이 강남" },
  roomType: { id: 2, name: "스탠다드" },
  checkInDate: "2026-11-04",
  checkOutDate: "2026-11-06",
  guestCount: 2,
  roomRate: 90000,
  nights: 2,
  baseAmount: 180000,
  discountAmount: 0,
  totalAmount: 180000,
  guest: { name: "김이용" },
};

const RESERVE_MESSAGE = "예약을 완료했습니다.";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("createStay", () => {
  it("검증한 본문으로 예약하고 예약 내용과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.createStay).mockResolvedValue({
      status: 201,
      headers: HEADERS,
      data: {
        success: true,
        data: RESERVED_STAY,
        message: RESERVE_MESSAGE,
        error: null,
      },
    });

    await expect(createStay(BODY)).resolves.toEqual({
      data: RESERVED_STAY,
      message: RESERVE_MESSAGE,
    });
    expect(generated.createStay).toHaveBeenCalledWith(BODY);
  });

  it("인원이 1보다 작으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(createStay({ ...BODY, guestCount: 0 })).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.createStay).not.toHaveBeenCalled();
  });

  it("409 응답이면 서버 오류 코드를 읽을 수 있는 오류를 던진다", async () => {
    vi.mocked(generated.createStay).mockResolvedValue({
      status: 409,
      headers: HEADERS,
      data: {
        success: false,
        data: null,
        message: null,
        error: {
          code: API_ERROR_CODES.roomTypeUnavailable,
          message: "선택한 기간과 인원으로 예약할 수 있는 객실이 없습니다.",
          fieldErrors: [],
        },
      },
    });

    const error = await createStay(BODY).catch((caught: unknown) => caught);

    expect(getApiError(error)?.code).toBe(API_ERROR_CODES.roomTypeUnavailable);
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.createStay).mockResolvedValue({
      status: 201,
      headers: HEADERS,
      data: { success: true, data: RESERVED_STAY, message: null, error: null },
    });

    await expect(createStay(BODY)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("fetchMyStays", () => {
  const PAGE_PARAMS = { period: "UPCOMING" as const, page: 0, size: 10 };
  const COOKIE = "JSESSIONID=abc";
  const MY_STAY = {
    id: 11,
    hotel: { id: 3, name: "어반스테이 강남" },
    roomType: { id: 2, name: "스탠다드" },
    checkInDate: "2026-11-04",
    checkOutDate: "2026-11-06",
    guestCount: 2,
    roomRate: 90000,
    nights: 2,
    baseAmount: 180000,
    discountAmount: 0,
    totalAmount: 180000,
    canceledAt: null,
  };

  function myStaysResponse(items: unknown[]) {
    return {
      status: 200,
      headers: HEADERS,
      data: {
        success: true,
        data: { items, page: 0, size: 100, totalElements: 1, totalPages: 1 },
        message: null,
        error: null,
      },
    } as never;
  }

  it("들어온 요청의 쿠키를 넘겨 내 이용 목록을 조회한다", async () => {
    vi.mocked(generated.getMyStays).mockResolvedValue(
      myStaysResponse([MY_STAY]),
    );

    const page = await fetchMyStays(PAGE_PARAMS, { cookie: COOKIE });

    expect(page.items).toEqual([MY_STAY]);
    expect(generated.getMyStays).toHaveBeenCalledWith(PAGE_PARAMS, {
      headers: { cookie: COOKIE },
    });
  });

  it("취소 시각 형식이 틀리면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getMyStays).mockResolvedValue(
      myStaysResponse([{ ...MY_STAY, canceledAt: "어제" }]),
    );

    await expect(
      fetchMyStays(PAGE_PARAMS, { cookie: COOKIE }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });
});
