import { describe, expect, it } from "vitest";
import { STAY_MESSAGES } from "../config/messages";
import {
  countNights,
  findCheckOutDateIssue,
  formatStayPeriod,
  isTodayOrLater,
} from "./stay-period";

describe("countNights", () => {
  it("달이 바뀌어도 체크인부터 체크아웃 전날까지의 박 수를 돌려준다", () => {
    expect(
      countNights({ checkInDate: "2026-11-29", checkOutDate: "2026-12-02" }),
    ).toBe(3);
  });
});

describe("formatStayPeriod", () => {
  it("기간과 박 수를 함께 보여주는 문구를 돌려준다", () => {
    expect(
      formatStayPeriod({ checkInDate: "2026-11-29", checkOutDate: "2026-12-02" }),
    ).toBe(STAY_MESSAGES.periodWithNights("2026-11-29", "2026-12-02", 3));
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
