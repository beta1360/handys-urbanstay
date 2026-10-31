import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAY_RULES, STAY_VALIDATION_MESSAGES } from "@/entities/stay";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { createStayReserveFormSchema } from "./stay-reserve-form-schema";

const CAPACITY = 2;

const VALUES = {
  checkInDate: "2026-11-02",
  checkOutDate: "2026-11-04",
  guestCount: "2",
  guest: { name: " 김이용 ", phone: "010-1234-5678", email: "guest@example.com" },
};

const schema = createStayReserveFormSchema(CAPACITY);

function fieldErrors(values: unknown) {
  const result = schema.safeParse(values);
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

describe("createStayReserveFormSchema", () => {
  it("맞는 값이면 앞뒤 공백을 지우고 인원을 숫자로 바꾼다", () => {
    expect(schema.parse(VALUES)).toEqual({
      ...VALUES,
      guestCount: 2,
      guest: { ...VALUES.guest, name: "김이용" },
    });
  });

  it("빈 값은 칸마다 필수 입력 오류를 낸다", () => {
    expect(
      fieldErrors({
        checkInDate: "",
        checkOutDate: "",
        guestCount: " ",
        guest: { name: "", phone: "", email: "" },
      }),
    ).toEqual({
      checkInDate: FORM_VALIDATION_MESSAGES.required,
      checkOutDate: FORM_VALIDATION_MESSAGES.required,
      guestCount: FORM_VALIDATION_MESSAGES.required,
      "guest.name": FORM_VALIDATION_MESSAGES.required,
      "guest.phone": FORM_VALIDATION_MESSAGES.required,
      "guest.email": FORM_VALIDATION_MESSAGES.required,
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
      "인원이 최대 인원을 넘으면",
      { guestCount: "3" },
      "guestCount",
      FORM_VALIDATION_MESSAGES.max(CAPACITY),
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
  ])("%s 서버와 같은 문구를 낸다", (_, override, field, message) => {
    expect(fieldErrors({ ...VALUES, ...override })).toEqual({
      [field]: message,
    });
  });

  it("오늘 체크인은 받는다", () => {
    expect(
      fieldErrors({ ...VALUES, checkInDate: "2026-10-31" }),
    ).toEqual({});
  });

  it.each([
    [
      "전화번호 형식이 틀리면",
      { phone: "010-12" },
      "guest.phone",
      FORM_VALIDATION_MESSAGES.phoneFormat,
    ],
    [
      "이메일 형식이 틀리면",
      { email: "guest@example" },
      "guest.email",
      FORM_VALIDATION_MESSAGES.emailFormat,
    ],
    [
      "이름이 최대 길이를 넘으면",
      { name: "가".repeat(51) },
      "guest.name",
      FORM_VALIDATION_MESSAGES.maxLength(50),
    ],
  ])("이용객의 %s 서버와 같은 문구를 낸다", (_, override, field, message) => {
    expect(
      fieldErrors({ ...VALUES, guest: { ...VALUES.guest, ...override } }),
    ).toEqual({ [field]: message });
  });

  it("다른 칸이 틀려도 체크아웃 날짜 규칙을 함께 검사한다", () => {
    expect(
      fieldErrors({
        ...VALUES,
        checkOutDate: "2026-11-01",
        guest: { ...VALUES.guest, name: "" },
      }),
    ).toEqual({
      checkOutDate: STAY_VALIDATION_MESSAGES.afterCheckIn,
      "guest.name": FORM_VALIDATION_MESSAGES.required,
    });
  });
});
