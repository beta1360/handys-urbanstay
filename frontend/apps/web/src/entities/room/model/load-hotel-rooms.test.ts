import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import { API_ERROR_CODES, ApiResponseError } from "@/shared/api";
import { getHotelRoomList } from "../api/hotel-room-list";
import { loadHotelRoom } from "./load-hotel-rooms";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("../api/hotel-room-list", () => ({
  getHotelRoomList: vi.fn(),
}));

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

beforeEach(() => {
  vi.mocked(getHotelRoomList).mockResolvedValue(ROOM_PAGE);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadHotelRoom", () => {
  it("호텔의 객실 목록에서 찾은 객실을 돌려준다", async () => {
    await expect(loadHotelRoom("3", "7")).resolves.toEqual(ROOM);
    expect(getHotelRoomList).toHaveBeenCalledWith(3);
  });

  it.each([
    ["호텔 id가 잘못되면", "abc", "7"],
    ["객실 id가 잘못되면", "3", "0"],
  ])("%s 조회하지 않고 찾을 수 없음으로 보낸다", async (_, hotelId, roomId) => {
    await expect(loadHotelRoom(hotelId, roomId)).rejects.toThrow("NOT_FOUND");
    expect(getHotelRoomList).not.toHaveBeenCalled();
  });

  it("객실이 그 호텔의 목록에 없으면 찾을 수 없음으로 보낸다", async () => {
    await expect(loadHotelRoom("3", "8")).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("호텔이 없다는 404면 찾을 수 없음으로 보낸다", async () => {
    vi.mocked(getHotelRoomList).mockRejectedValue(
      new ApiResponseError("getHotelRooms", 404, {
        code: API_ERROR_CODES.hotelNotFound,
        message: "호텔을 찾을 수 없습니다.",
        fieldErrors: [],
      }),
    );

    await expect(loadHotelRoom("3", "7")).rejects.toThrow("NOT_FOUND");
  });

  it("그 밖의 실패는 그대로 던져 오류 화면으로 보낸다", async () => {
    const error = new ApiResponseError("getHotelRooms", 500, undefined);
    vi.mocked(getHotelRoomList).mockRejectedValue(error);

    await expect(loadHotelRoom("3", "7")).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
  });
});
