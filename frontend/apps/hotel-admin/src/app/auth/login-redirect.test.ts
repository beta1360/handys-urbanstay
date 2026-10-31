import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIN_REDIRECT, loginSearchSchema } from "./login-redirect";

describe("loginSearchSchema", () => {
  it("앱 안의 경로는 쿼리와 함께 그대로 둔다", () => {
    expect(loginSearchSchema.parse({ redirect: "/rooms?page=2" })).toEqual({
      redirect: "/rooms?page=2",
    });
  });

  it.each([
    ["//로 시작하는 다른 호스트 주소", "//evil.example"],
    ["백슬래시로 바꾼 다른 호스트 주소", "/\\evil.example"],
    ["탭을 끼운 다른 호스트 주소", "/\t/evil.example"],
    ["외부 주소", "https://evil.example"],
    ["/로 시작하지 않는 경로", "rooms"],
    ["로그인 화면", "/login"],
    ["쿼리가 붙은 로그인 화면", "/login?redirect=%2Frooms"],
  ])("%s는 기본 경로로 바꾼다", (_, redirect) => {
    expect(loginSearchSchema.parse({ redirect })).toEqual({
      redirect: DEFAULT_LOGIN_REDIRECT,
    });
  });

  it("redirect가 없으면 기본 경로로 정한다", () => {
    expect(loginSearchSchema.parse({})).toEqual({
      redirect: DEFAULT_LOGIN_REDIRECT,
    });
  });

  it("redirect가 문자열이 아니면 기본 경로로 정한다", () => {
    expect(loginSearchSchema.parse({ redirect: 123 })).toEqual({
      redirect: DEFAULT_LOGIN_REDIRECT,
    });
  });
});
