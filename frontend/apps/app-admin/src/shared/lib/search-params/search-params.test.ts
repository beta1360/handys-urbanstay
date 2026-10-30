import { describe, expect, it } from "vitest";
import { parseSearch, stringifySearch } from "./search-params";

describe("parseSearch", () => {
  it("모든 값을 글자로 읽는다", () => {
    expect(parseSearch("?keyword=101&page=2&flag=true")).toEqual({
      keyword: "101",
      page: "2",
      flag: "true",
    });
  });

  it("인코딩된 값을 풀어 읽는다", () => {
    expect(
      parseSearch("?keyword=%EC%96%B4%EB%B0%98+%EC%8A%A4%ED%85%8C%EC%9D%B4"),
    ).toEqual({ keyword: "어반 스테이" });
  });

  it("값이 없으면 빈 객체를 돌려준다", () => {
    expect(parseSearch("")).toEqual({});
  });
});

describe("stringifySearch", () => {
  it("숫자만 있는 값도 따옴표 없이 쓴다", () => {
    expect(stringifySearch({ keyword: "101", page: 2 })).toBe(
      "?keyword=101&page=2",
    );
  });

  it("undefined·null인 값은 쓰지 않고 남는 값이 없으면 빈 문자열이다", () => {
    expect(stringifySearch({ keyword: undefined, page: null })).toBe("");
  });

  it.each([
    ["쿼리가 들어 있는 redirect", { redirect: "/hotels?keyword=101&page=2" }],
    ["공백·한글·기호가 들어 있는 값", { keyword: "어반 스테이 +&=?#%" }],
  ])("%s도 쓰고 다시 읽으면 그대로다", (_, search) => {
    expect(parseSearch(stringifySearch(search))).toEqual(search);
  });
});
