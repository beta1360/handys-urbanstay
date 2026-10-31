import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { STAY_VALIDATION_MESSAGES } from "../config/messages";
import { STAY_RULES } from "../config/rules";
import {
  parseStayCriteria,
  stayCriteriaSchema,
  toStayCriteriaSearch,
} from "./stay-criteria";

const VALUES = {
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  guestCount: " 2 ",
};

const CRITERIA = {
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  guestCount: 2,
};

function fieldErrors(values: unknown) {
  const result = stayCriteriaSchema.safeParse(values);
  if (result.success) {
    return {};
  }
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T15:30:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("stayCriteriaSchema", () => {
  it("맞는 값이면 인원을 숫자로 바꾼다", () => {
    expect(stayCriteriaSchema.parse(VALUES)).toEqual(CRITERIA);
  });

  it("빈 값은 칸마다 필수 입력 오류를 낸다", () => {
    expect(
      fieldErrors({ checkInDate: "", checkOutDate: "", guestCount: "" }),
    ).toEqual({
      checkInDate: FORM_VALIDATION_MESSAGES.required,
      checkOutDate: FORM_VALIDATION_MESSAGES.required,
      guestCount: FORM_VALIDATION_MESSAGES.required,
    });
  });

  it.each([
    [
      "체크인이 오늘(한국 시간) 전이면",
      { checkInDate: "2026-10-30" },
      "checkInDate",
      STAY_VALIDATION_MESSAGES.todayOrLater,
    ],
    [
      "체크아웃이 체크인과 같으면",
      { checkOutDate: "2026-11-02" },
      "checkOutDate",
      STAY_VALIDATION_MESSAGES.afterCheckIn,
    ],
    [
      "최대 박 수를 넘으면",
      { checkOutDate: "2026-12-03" },
      "checkOutDate",
      STAY_VALIDATION_MESSAGES.maxNights(STAY_RULES.maxNights),
    ],
    [
      "인원이 0이면",
      { guestCount: "0" },
      "guestCount",
      FORM_VALIDATION_MESSAGES.min(1),
    ],
    [
      "인원이 정수가 아니면",
      { guestCount: "1.5" },
      "guestCount",
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ],
    [
      "날짜 형식이 틀리면",
      { checkInDate: "2026-13-01" },
      "checkInDate",
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ],
  ])("%s 서버와 같은 문구를 낸다", (_, override, field, message) => {
    expect(fieldErrors({ ...VALUES, ...override })).toEqual({
      [field]: message,
    });
  });

  it("오늘 체크인은 받는다", () => {
    expect(fieldErrors({ ...VALUES, checkInDate: "2026-10-31" })).toEqual({});
  });

  it("인원이 틀려도 체크아웃 날짜 규칙을 함께 검사한다", () => {
    expect(
      fieldErrors({ ...VALUES, checkOutDate: "2026-11-01", guestCount: "" }),
    ).toEqual({
      checkOutDate: STAY_VALIDATION_MESSAGES.afterCheckIn,
      guestCount: FORM_VALIDATION_MESSAGES.required,
    });
  });
});

describe("URL search", () => {
  it("검색 조건을 search로 바꾸고 다시 읽으면 같은 조건이다", () => {
    const search = toStayCriteriaSearch(CRITERIA);

    expect(search).toBe(
      "?checkInDate=2026-11-02&checkOutDate=2026-11-04&guestCount=2",
    );
    expect(parseStayCriteria(new URLSearchParams(search))).toEqual(CRITERIA);
  });

  it.each([
    ["값이 없으면", ""],
    ["지난 날짜면", "?checkInDate=2026-10-01&checkOutDate=2026-10-03&guestCount=2"],
    ["인원이 숫자가 아니면", "?checkInDate=2026-11-02&checkOutDate=2026-11-04&guestCount=two"],
  ])("%s 검색 조건이 없다", (_, search) => {
    expect(parseStayCriteria(new URLSearchParams(search))).toBeUndefined();
  });
});
