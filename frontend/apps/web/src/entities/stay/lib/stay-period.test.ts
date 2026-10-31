import { describe, expect, it } from "vitest";
import {
  countNights,
  findCheckOutDateIssue,
  isPeriodOverlapped,
  isTodayOrLater,
} from "./stay-period";

const RESERVED = [{ checkInDate: "2026-11-10", checkOutDate: "2026-11-13" }];

describe("isPeriodOverlapped", () => {
  it.each([
    ["예약된 기간 안", "2026-11-11", "2026-11-12", true],
    ["체크인이 예약된 기간 안", "2026-11-12", "2026-11-15", true],
    ["체크아웃이 예약된 기간 안", "2026-11-08", "2026-11-11", true],
    ["예약된 기간을 감싸는", "2026-11-09", "2026-11-14", true],
    ["예약된 기간과 같은", "2026-11-10", "2026-11-13", true],
    ["예약된 체크아웃 날 체크인하는", "2026-11-13", "2026-11-15", false],
    ["예약된 체크인 날 체크아웃하는", "2026-11-08", "2026-11-10", false],
    ["예약된 기간보다 앞의", "2026-11-01", "2026-11-05", false],
  ])("%s 기간(%s~%s)이면 %s를 돌려준다", (_, checkInDate, checkOutDate, expected) => {
    expect(isPeriodOverlapped({ checkInDate, checkOutDate }, RESERVED)).toBe(
      expected,
    );
  });

  it("예약된 기간이 없으면 겹치지 않는다", () => {
    expect(
      isPeriodOverlapped(
        { checkInDate: "2026-11-10", checkOutDate: "2026-11-13" },
        [],
      ),
    ).toBe(false);
  });
});

describe("countNights", () => {
  it("달이 바뀌어도 체크인부터 체크아웃 전날까지의 박 수를 돌려준다", () => {
    expect(
      countNights({ checkInDate: "2026-11-29", checkOutDate: "2026-12-02" }),
    ).toBe(3);
  });
});

describe("findCheckOutDateIssue", () => {
  it.each([
    ["체크인과 같은 날", "2026-11-10", "afterCheckIn"],
    ["체크인보다 앞선 날", "2026-11-09", "afterCheckIn"],
    ["31박이 되는 날", "2026-12-11", "maxNights"],
    ["30박이 되는 날", "2026-12-10", undefined],
    ["1박이 되는 날", "2026-11-11", undefined],
  ])("체크아웃이 %s이면 %s를 돌려준다", (_, checkOutDate, expected) => {
    expect(
      findCheckOutDateIssue({ checkInDate: "2026-11-10", checkOutDate }),
    ).toBe(expected);
  });
});

describe("isTodayOrLater", () => {
  it.each([
    ["어제", "2026-10-30", false],
    ["오늘", "2026-10-31", true],
    ["내일", "2026-11-01", true],
  ])("%s 날짜면 %s를 돌려준다", (_, date, expected) => {
    expect(isTodayOrLater(date, "2026-10-31")).toBe(expected);
  });
});
