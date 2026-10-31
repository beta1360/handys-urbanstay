import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, getApiError } from "./api-error";
import * as generated from "./generated";
import { fetchHotelRoomTypes, roomTypesQueryKey } from "./room-type";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelRoomTypes: vi.fn(),
}));

const HOTEL_ID = 3;

const PARAMS = {
  checkInDate: "2026-11-04",
  checkOutDate: "2026-11-06",
  guestCount: 2,
};

const ROOM_TYPE_TIMES = { checkInTime: "15:00", checkOutTime: "11:00" };

const ROOM_TYPES = [
  {
    id: 1,
    name: "디럭스",
    capacity: 4,
    roomRate: 150000,
    ...ROOM_TYPE_TIMES,
    roomCount: 2,
    availableCount: 0,
  },
  {
    id: 2,
    name: "스탠다드",
    capacity: 2,
    roomRate: 90000,
    ...ROOM_TYPE_TIMES,
    roomCount: 3,
    availableCount: 2,
  },
];

const HEADERS = new Headers();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchHotelRoomTypes", () => {
  it("호텔 ID·조건과 signal을 넘겨 객실 유형 목록을 돌려준다", async () => {
    vi.mocked(generated.getHotelRoomTypes).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: { success: true, data: ROOM_TYPES, message: null, error: null },
    });
    const { signal } = new AbortController();

    await expect(
      fetchHotelRoomTypes(HOTEL_ID, PARAMS, { signal }),
    ).resolves.toEqual(ROOM_TYPES);
    expect(generated.getHotelRoomTypes).toHaveBeenCalledWith(HOTEL_ID, PARAMS, {
      signal,
    });
  });

  it("인원이 1보다 작으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      fetchHotelRoomTypes(HOTEL_ID, { ...PARAMS, guestCount: 0 }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.getHotelRoomTypes).not.toHaveBeenCalled();
  });

  it("남은 객실 수가 빠지면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getHotelRoomTypes).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: {
        success: true,
        data: [{ id: 1, name: "디럭스", capacity: 4, roomCount: 2 }],
        message: null,
        error: null,
      },
    } as never);

    await expect(fetchHotelRoomTypes(HOTEL_ID, PARAMS)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it("404 응답이면 서버 오류 코드를 읽을 수 있는 오류를 던진다", async () => {
    vi.mocked(generated.getHotelRoomTypes).mockResolvedValue({
      status: 404,
      headers: HEADERS,
      data: {
        success: false,
        data: null,
        message: null,
        error: {
          code: API_ERROR_CODES.hotelNotFound,
          message: "호텔을 찾을 수 없습니다.",
          fieldErrors: [],
        },
      },
    });

    const error = await fetchHotelRoomTypes(HOTEL_ID, PARAMS).catch(
      (caught: unknown) => caught,
    );

    expect(getApiError(error)?.code).toBe(API_ERROR_CODES.hotelNotFound);
  });

  it("조건 없이 만든 키가 조건 있는 키의 앞부분이라 호텔 단위로 무효화할 수 있다", () => {
    expect(roomTypesQueryKey(HOTEL_ID, PARAMS).slice(0, 1)).toEqual(
      roomTypesQueryKey(HOTEL_ID),
    );
  });
});
