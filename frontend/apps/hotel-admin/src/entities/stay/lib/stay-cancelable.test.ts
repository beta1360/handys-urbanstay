import { describe, expect, it } from "vitest";
import { isStayCancelable } from "./stay-cancelable";

const TODAY = "2026-11-01";

const CANCELLATION = {
  canceledAt: "2026-10-30T06:59:32Z",
  canceledBy: { id: 1, name: "홍길동" },
  reason: null,
};

describe("isStayCancelable", () => {
  it.each([
    ["체크아웃 날짜가 내일이면 취소할 수 있다", "2026-11-02", null, true],
    ["체크아웃 날짜가 오늘이면 끝난 이용이라 취소할 수 없다", TODAY, null, false],
    ["체크아웃 날짜가 지났으면 취소할 수 없다", "2026-10-31", null, false],
    [
      "이미 취소했으면 체크아웃 날짜가 뒤여도 취소할 수 없다",
      "2026-11-05",
      CANCELLATION,
      false,
    ],
  ])("%s", (_, checkOutDate, cancellation, expected) => {
    expect(isStayCancelable({ checkOutDate, cancellation }, TODAY)).toBe(
      expected,
    );
  });
});
