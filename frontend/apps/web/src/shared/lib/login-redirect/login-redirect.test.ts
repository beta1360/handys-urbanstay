import { describe, expect, it } from "vitest";
import { ROUTES } from "@/shared/config";
import { loginReturnTo, sanitizeLoginRedirect } from "./login-redirect";

describe("sanitizeLoginRedirect", () => {
  it.each([
    ["다른 호스트로 가는 주소", "//evil.com"],
    ["역슬래시가 든 주소", "/\\evil"],
    ["제어 문자가 든 주소", "/\t/evil"],
    ["절대 주소", "https://x"],
    ["정규화하면 //로 시작하는 주소(.)", "/.//evil"],
    ["정규화하면 //로 시작하는 주소(..)", "/..//evil"],
    ["로그인 화면", "/login?x"],
    ["문자열이 아닌 값", ["/me/stays", "/"]],
    ["빈 값", undefined],
  ])("%s는 호텔 목록으로 바꾼다", (_, value) => {
    expect(sanitizeLoginRedirect(value)).toBe(ROUTES.hotels);
  });

  it("앱 안의 경로는 search와 hash까지 그대로 둔다", () => {
    expect(sanitizeLoginRedirect("/me/stays?x=1#h")).toBe("/me/stays?x=1#h");
  });
});

describe("loginReturnTo", () => {
  it.each([
    ["로그인 화면이면 그 화면의 redirect", "/login?redirect=%2Fme%2Fstays", "/me/stays"],
    ["회원가입 화면에 redirect가 없으면 호텔 목록", "/signup", ROUTES.hotels],
    ["그 밖의 화면이면 지금 주소", "/hotels/3?guestCount=2", "/hotels/3?guestCount=2"],
  ])("%s로 돌아온다", (_, currentHref, expected) => {
    expect(loginReturnTo(currentHref)).toBe(expected);
  });
});
