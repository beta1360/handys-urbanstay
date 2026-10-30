import { z } from "zod";
import { describe, expect, it } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "../config";
import {
  optionalTextSchema,
  passwordSchema,
  requiredTextSchema,
} from "./form-field-schema";

const FORMAT_MESSAGE = "형식 오류";

const INVALID_MESSAGE = "규칙 오류";

const textRule = z.string().min(1).max(5).regex(/^\d+$/);

function messagesOf(schema: z.ZodType, value: string) {
  const { error } = schema.safeParse(value);
  return error?.issues.map(({ message }) => message) ?? [];
}

describe("requiredTextSchema", () => {
  it("앞뒤 공백을 지운 값으로 검사하고 지운 값을 돌려준다", () => {
    expect(requiredTextSchema(textRule).parse("  123  ")).toBe("123");
  });

  it.each(["", "   "])("%j는 필수 오류 하나만 낸다", (value) => {
    const schema = requiredTextSchema(textRule, FORMAT_MESSAGE);

    expect(messagesOf(schema, value)).toEqual([
      FORM_VALIDATION_MESSAGES.required,
    ]);
  });

  it("형식이 틀리면 길어도 형식 오류를, 형식이 맞는데 길면 길이 오류를 낸다", () => {
    const schema = requiredTextSchema(textRule, FORMAT_MESSAGE);

    expect(messagesOf(schema, "abcdefg")).toEqual([FORMAT_MESSAGE]);
    expect(messagesOf(schema, "1234567")).toEqual([
      FORM_VALIDATION_MESSAGES.maxLength(5),
    ]);
  });
});

describe("optionalTextSchema", () => {
  const optionalRule = z.string().max(5);

  it.each(["", "  \n  "])("%j는 null로 바꾼다", (value) => {
    expect(optionalTextSchema(optionalRule).parse(value)).toBeNull();
  });

  it("길면 길이 오류를 낸다", () => {
    expect(messagesOf(optionalTextSchema(optionalRule), "1234567")).toEqual([
      FORM_VALIDATION_MESSAGES.maxLength(5),
    ]);
  });
});

describe("passwordSchema", () => {
  const passwordRule = z.string().min(3);

  it("공백을 지우지 않고 입력한 그대로 돌려준다", () => {
    expect(passwordSchema(passwordRule, INVALID_MESSAGE).parse(" ab ")).toBe(
      " ab ",
    );
  });

  it("공백만 있으면 필수 오류를, 규칙을 어기면 넘긴 문구 하나를 낸다", () => {
    const schema = passwordSchema(passwordRule, INVALID_MESSAGE);

    expect(messagesOf(schema, "  ")).toEqual([
      FORM_VALIDATION_MESSAGES.required,
    ]);
    expect(messagesOf(schema, "ab")).toEqual([INVALID_MESSAGE]);
  });
});
