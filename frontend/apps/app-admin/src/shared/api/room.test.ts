import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import { getHotelRoomsQuerySizeDefault } from "./generated/zod";
import { fetchHotelRooms, hotelRoomListQueryKey } from "./room";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelRooms: vi.fn(),
}));

const HOTEL_ID = 1;

const ROOM = {
  id: 21,
  name: "101",
  roomType: { id: 4, name: "스탠다드" },
  floor: null,
  status: "VACANT" as const,
};

function toResponse<T>(items: T[]) {
  return {
    success: true,
    data: { items, page: 0, size: 10, totalElements: items.length, totalPages: 1 },
    message: null,
    error: null,
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchHotelRooms", () => {
  it("호텔 ID·페이지와 signal을 넘겨 객실 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getHotelRooms).mockResolvedValue(toResponse([ROOM]));
    const { signal } = new AbortController();

    await expect(
      fetchHotelRooms(HOTEL_ID, { page: 1 }, { signal }),
    ).resolves.toEqual(toResponse([ROOM]).data);
    expect(generated.getHotelRooms).toHaveBeenCalledWith(
      HOTEL_ID,
      { page: 1, size: getHotelRoomsQuerySizeDefault },
      undefined,
      signal,
    );
  });

  it("page가 범위를 넘으면 요청을 보내지 않는다", async () => {
    await expect(
      fetchHotelRooms(HOTEL_ID, { page: 100 }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.getHotelRooms).not.toHaveBeenCalled();
  });

  it("모르는 상태 값이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getHotelRooms).mockResolvedValue(
      toResponse([{ ...ROOM, status: "CLOSED" }]) as never,
    );

    await expect(fetchHotelRooms(HOTEL_ID, {})).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it("쿼리 키는 요청 경로를 따른다", () => {
    expect(hotelRoomListQueryKey(HOTEL_ID, { page: 0 })).toEqual([
      `/api/v1/app-admin/hotels/${HOTEL_ID}/rooms`,
      { page: 0 },
    ]);
  });
});
