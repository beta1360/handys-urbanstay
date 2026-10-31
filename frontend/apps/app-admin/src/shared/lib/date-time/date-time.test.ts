import { describe, expect, it } from "vitest";
import { formatKoreanDate } from "./date-time";

describe("formatKoreanDate", () => {
  it.each([
    ["2026-10-30T06:59:32.123456Z", "2026-10-30"],
    ["2026-10-30T15:00:00Z", "2026-10-31"],
    ["2026-12-31T14:59:59Z", "2026-12-31"],
  ])("UTC 시각 %s를 한국 날짜 %s로 보여준다", (isoDateTime, expected) => {
    expect(formatKoreanDate(isoDateTime)).toBe(expected);
  });
});
