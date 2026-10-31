import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, getApiError } from "./api-error";
import * as generated from "./generated";
import { fetchHotelRooms } from "./room";
import { RequestValidationError } from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelRooms: vi.fn(),
}));

const HOTEL_ID = 3;

const ROOM = {
  id: 7,
  name: "101",
  type: "스탠다드",
  capacity: 2,
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

const ROOM_PAGE = {
  items: [ROOM],
  page: 0,
  size: 100,
  totalElements: 1,
  totalPages: 1,
};

const HEADERS = new Headers();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchHotelRooms", () => {
  it("호텔 ID와 페이지 파라미터를 넘겨 객실 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getHotelRooms).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: { success: true, data: ROOM_PAGE, message: null, error: null },
    });

    await expect(
      fetchHotelRooms(HOTEL_ID, { page: 0, size: 100 }),
    ).resolves.toEqual(ROOM_PAGE);
    expect(generated.getHotelRooms).toHaveBeenCalledWith(HOTEL_ID, {
      page: 0,
      size: 100,
    });
  });

  it("404 응답이면 서버 오류 코드를 읽을 수 있는 오류를 던진다", async () => {
    vi.mocked(generated.getHotelRooms).mockResolvedValue({
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

    const error = await fetchHotelRooms(HOTEL_ID, {}).catch(
      (caught: unknown) => caught,
    );

    expect(getApiError(error)?.code).toBe(API_ERROR_CODES.hotelNotFound);
  });

  it("size가 범위를 넘으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      fetchHotelRooms(HOTEL_ID, { size: 101 }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.getHotelRooms).not.toHaveBeenCalled();
  });
});
