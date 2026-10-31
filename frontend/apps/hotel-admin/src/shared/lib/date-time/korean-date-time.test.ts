import { afterEach, describe, expect, it, vi } from "vitest";
import { formatKoreanDateTime, getKoreanToday } from "./korean-date-time";

describe("formatKoreanDateTime", () => {
  it.each([
    ["2026-10-30T06:59:32.123456Z", "2026-10-30 15:59"],
    ["2026-10-30T15:05:00Z", "2026-10-31 00:05"],
    ["2026-01-02T03:04:05.120Z", "2026-01-02 12:04"],
  ])("UTC 시각 %s를 한국 시간 %s로 보여준다", (isoDateTime, expected) => {
    expect(formatKoreanDateTime(isoDateTime)).toBe(expected);
  });
});

describe("getKoreanToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["2026-10-31T14:59:59Z", "2026-10-31"],
    ["2026-10-31T15:00:00Z", "2026-11-01"],
  ])("지금이 UTC %s면 한국 시간 오늘 %s를 돌려준다", (now, expected) => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(now) });

    expect(getKoreanToday()).toBe(expected);
  });
});
