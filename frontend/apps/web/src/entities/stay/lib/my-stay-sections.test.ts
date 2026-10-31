import { describe, expect, it } from "vitest";
import { splitMyStays } from "./my-stay-sections";

const TODAY = "2026-10-31";

function stay(id: number, checkInDate: string, checkOutDate: string) {
  return {
    id,
    hotel: { id: 1, name: "어반스테이 강남" },
    roomType: { id: 2, name: "스탠다드" },
    checkInDate,
    checkOutDate,
    guestCount: 2,
    roomRate: 90000,
    nights: 1,
    baseAmount: 90000,
    discountAmount: 0,
    totalAmount: 90000,
    canceledAt: null,
  };
}

describe("splitMyStays", () => {
  it("체크아웃 날짜가 오늘보다 뒤면 지금·앞으로의 이용, 오늘이거나 지났으면 지난 이용으로 나눈다", () => {
    const upcoming = stay(1, "2026-11-05", "2026-11-07");
    const staying = stay(2, "2026-10-30", "2026-11-01");
    const checkOutToday = stay(3, "2026-10-29", TODAY);
    const past = stay(4, "2026-10-01", "2026-10-03");

    expect(
      splitMyStays([upcoming, staying, checkOutToday, past], TODAY),
    ).toEqual({
      upcoming: [staying, upcoming],
      past: [checkOutToday, past],
    });
  });

  it("지금·앞으로의 이용은 체크인이 가까운 순, 같으면 id 순으로 두고 지난 이용은 받은 순서를 그대로 둔다", () => {
    const later = stay(10, "2026-11-20", "2026-11-21");
    const soonHigherId = stay(12, "2026-11-02", "2026-11-03");
    const soonLowerId = stay(11, "2026-11-02", "2026-11-04");
    const recentPast = stay(9, "2026-10-20", "2026-10-21");
    const olderPast = stay(8, "2026-10-01", "2026-10-02");

    expect(
      splitMyStays(
        [later, soonHigherId, soonLowerId, recentPast, olderPast],
        TODAY,
      ),
    ).toEqual({
      upcoming: [soonLowerId, soonHigherId, later],
      past: [recentPast, olderPast],
    });
  });

  it("취소한 이용도 체크아웃 날짜로 같은 기준에 따라 나눈다", () => {
    const canceled = {
      ...stay(5, "2026-11-10", "2026-11-12"),
      canceledAt: "2026-10-30T01:00:00Z",
    };

    expect(splitMyStays([canceled], TODAY)).toEqual({
      upcoming: [canceled],
      past: [],
    });
  });
});
