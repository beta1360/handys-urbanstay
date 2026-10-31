import { describe, expect, it } from "vitest";
import { formatWon } from "./currency";

describe("formatWon", () => {
  it.each([
    [0, "0원"],
    [900, "900원"],
    [200000, "200,000원"],
    [1234567, "1,234,567원"],
  ])("%d을 천 단위 쉼표와 원으로 %s로 보여준다", (amount, expected) => {
    expect(formatWon(amount)).toBe(expected);
  });
});
