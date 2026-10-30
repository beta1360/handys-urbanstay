import { z } from "zod";
import { afterEach, assert, describe, expect, it } from "vitest";
import {
  focusFirstInvalidField,
  hasFieldError,
  toFieldErrors,
  toIssueFieldMessages,
} from "./field-errors";

const FIELDS = ["name", "master.loginId"] as const;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("toIssueFieldMessages", () => {
  it("zod 오류의 경로를 점으로 이어 필드 이름으로 쓴다", () => {
    const schema = z.object({
      name: z.string().min(1, "이름 오류"),
      master: z.object({ loginId: z.string().min(1, "아이디 오류") }),
    });
    const { error } = schema.safeParse({ name: "", master: { loginId: "" } });

    assert(error);
    expect(toIssueFieldMessages(error)).toEqual([
      { field: "name", message: "이름 오류" },
      { field: "master.loginId", message: "아이디 오류" },
    ]);
  });
});

describe("toFieldErrors", () => {
  it("폼에 있는 필드만 골라 필드마다 첫 문구 하나를 남긴다", () => {
    expect(
      toFieldErrors(FIELDS, [
        { field: "master.loginId", message: "첫 문구" },
        { field: "unknown", message: "알 수 없는 필드" },
        { field: "master.loginId", message: "둘째 문구" },
      ]),
    ).toEqual({ "master.loginId": "첫 문구" });
  });
});

describe("hasFieldError", () => {
  it("폼 필드 중 하나라도 오류가 있을 때만 true다", () => {
    expect(hasFieldError(FIELDS, {})).toBe(false);
    expect(hasFieldError(FIELDS, { name: undefined })).toBe(false);
    expect(hasFieldError(FIELDS, { name: "오류" })).toBe(true);
  });
});

describe("focusFirstInvalidField", () => {
  it("필드 순서에서 첫 번째로 틀린 입력창에 초점을 옮긴다", () => {
    const form = document.createElement("form");
    for (const name of FIELDS) {
      const input = document.createElement("input");
      input.name = name;
      form.append(input);
    }
    document.body.append(form);

    focusFirstInvalidField(form, FIELDS, {
      "master.loginId": "아이디 오류",
      name: "이름 오류",
    });

    expect(form.elements.namedItem("name")).toHaveFocus();
  });
});
