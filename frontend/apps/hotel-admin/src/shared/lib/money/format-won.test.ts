import { describe, expect, it } from "vitest";
import { formatWon } from "./format-won";

describe("formatWon", () => {
  it("천 단위마다 쉼표를 넣고 뒤에 원을 붙인다", () => {
    expect(formatWon(1234567)).toBe("1,234,567원");
    expect(formatWon(0)).toBe("0원");
  });
});
