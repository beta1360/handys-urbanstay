import { afterEach, describe, expect, it, vi } from "vitest";
import { getHotelList } from "../api/hotel-list";
import { loadHotelList } from "./load-hotel-list";

vi.mock("../api/hotel-list", () => ({
  getHotelList: vi.fn(),
}));

function hotel(id: number, roomCount: number) {
  return { id, name: `어반스테이 ${id}호점`, address: "서울 강남구", roomCount };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadHotelList", () => {
  it("서버 순서를 그대로 두고 객실이 하나라도 있는 호텔만 고를 수 있게 한다", async () => {
    vi.mocked(getHotelList).mockResolvedValue({
      items: [hotel(2, 12), hotel(1, 1), hotel(3, 0)],
      page: 0,
      size: 100,
      totalElements: 3,
      totalPages: 1,
    });

    const state = await loadHotelList();

    expect(
      state.status === "ready"
        ? state.hotels.map(({ id, bookable }) => ({ id, bookable }))
        : state,
    ).toEqual([
      { id: 2, bookable: true },
      { id: 1, bookable: true },
      { id: 3, bookable: false },
    ]);
  });
});
