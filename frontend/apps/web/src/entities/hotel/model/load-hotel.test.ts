import { afterEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import { findHotel } from "../api/hotel-list";
import { loadHotel } from "./load-hotel";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("../api/hotel-list", () => ({
  findHotel: vi.fn(),
}));

const HOTEL = { id: 3, name: "어반스테이 강남", address: "서울 강남구" };

afterEach(() => {
  vi.clearAllMocks();
});

describe("loadHotel", () => {
  it("호텔 목록에서 찾은 호텔을 돌려준다", async () => {
    vi.mocked(findHotel).mockResolvedValue(HOTEL);

    await expect(loadHotel("3")).resolves.toEqual(HOTEL);
    expect(findHotel).toHaveBeenCalledWith(3);
  });

  it("잘못된 id면 조회하지 않고 찾을 수 없음으로 보낸다", async () => {
    await expect(loadHotel("abc")).rejects.toThrow("NOT_FOUND");
    expect(findHotel).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  it("호텔 목록에 없으면 찾을 수 없음으로 보낸다", async () => {
    vi.mocked(findHotel).mockResolvedValue(undefined);

    await expect(loadHotel("3")).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
