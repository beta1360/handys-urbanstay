import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, getApiError } from "./api-error";
import * as generated from "./generated";
import {
  createStay,
  fetchRoomReservedPeriods,
  reservedPeriodsQueryKey,
} from "./stay";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getRoomReservedPeriods: vi.fn(),
  createStay: vi.fn(),
}));

const ROOM_ID = 7;

const HEADERS = new Headers();

const PERIOD_PAGE = {
  items: [{ checkInDate: "2026-11-02", checkOutDate: "2026-11-04" }],
  page: 0,
  size: 100,
  totalElements: 1,
  totalPages: 1,
};

const BODY = {
  roomId: ROOM_ID,
  checkInDate: "2026-11-04",
  checkOutDate: "2026-11-06",
  guestCount: 2,
  guest: { name: "김이용", phone: "010-1234-5678", email: "guest@example.com" },
};

const RESERVED_STAY = {
  id: 11,
  hotel: { id: 3, name: "어반스테이 강남" },
  room: { id: ROOM_ID, name: "101" },
  checkInDate: "2026-11-04",
  checkOutDate: "2026-11-06",
  guestCount: 2,
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

describe("fetchRoomReservedPeriods", () => {
  it("객실 ID·페이지 파라미터와 signal을 넘겨 예약된 기간 페이지를 돌려준다", async () => {
    vi.mocked(generated.getRoomReservedPeriods).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: { success: true, data: PERIOD_PAGE, message: null, error: null },
    });
    const { signal } = new AbortController();

    await expect(
      fetchRoomReservedPeriods(ROOM_ID, { page: 0, size: 100 }, { signal }),
    ).resolves.toEqual(PERIOD_PAGE);
    expect(generated.getRoomReservedPeriods).toHaveBeenCalledWith(
      ROOM_ID,
      { page: 0, size: 100 },
      { signal },
    );
  });

  it("생성된 쿼리 키를 쓴다", () => {
    expect(reservedPeriodsQueryKey(ROOM_ID, { size: 100 })).toEqual(
      generated.getGetRoomReservedPeriodsQueryKey(ROOM_ID, { size: 100 }),
    );
  });
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

  it("전화번호 형식이 틀리면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      createStay({ ...BODY, guest: { ...BODY.guest, phone: "010-12" } }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.createStay).not.toHaveBeenCalled();
  });

  it("409 응답이면 겹침 오류 코드를 읽을 수 있는 오류를 던진다", async () => {
    vi.mocked(generated.createStay).mockResolvedValue({
      status: 409,
      headers: HEADERS,
      data: {
        success: false,
        data: null,
        message: null,
        error: {
          code: API_ERROR_CODES.stayPeriodOverlapped,
          message: "같은 객실에 기간이 겹치는 이용이 이미 있습니다.",
          fieldErrors: [],
        },
      },
    });

    const error = await createStay(BODY).catch((caught: unknown) => caught);

    expect(getApiError(error)?.code).toBe(API_ERROR_CODES.stayPeriodOverlapped);
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
