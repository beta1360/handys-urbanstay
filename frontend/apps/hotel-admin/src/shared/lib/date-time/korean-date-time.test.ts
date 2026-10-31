import { describe, expect, it } from "vitest";
import { formatKoreanDateTime } from "./korean-date-time";

describe("formatKoreanDateTime", () => {
  it.each([
    ["2026-10-30T06:59:32.123456Z", "2026-10-30 15:59"],
    ["2026-10-30T15:05:00Z", "2026-10-31 00:05"],
    ["2026-01-02T03:04:05.120Z", "2026-01-02 12:04"],
  ])("UTC 시각 %s를 한국 시간 %s로 보여준다", (isoDateTime, expected) => {
    expect(formatKoreanDateTime(isoDateTime)).toBe(expected);
  });
});
