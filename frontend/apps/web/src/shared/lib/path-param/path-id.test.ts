import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parsePathId } from "./path-id";

const ID_SCHEMA = z.int();

describe("parsePathId", () => {
  it.each([
    ["1", 1],
    ["01", 1],
    ["42", 42],
  ])("숫자만 있는 %s는 %d로 바꾼다", (value, expected) => {
    expect(parsePathId(value, ID_SCHEMA)).toBe(expected);
  });

  it.each(["0", "-1", "1.5", "1e3", "abc", "", "9007199254740993"])(
    "%s는 쓸 수 없는 id라 undefined를 돌려준다",
    (value) => {
      expect(parsePathId(value, ID_SCHEMA)).toBeUndefined();
    },
  );
});
