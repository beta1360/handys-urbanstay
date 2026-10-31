import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, getApiError } from "./api-error";
import * as generated from "./generated";
import { fetchMe, loginMember, signupMember } from "./member";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  signup: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
}));

const HEADERS = new Headers();

const MEMBER = {
  id: 1,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
};

const SIGNUP_BODY = {
  email: MEMBER.email,
  password: "password1",
  name: MEMBER.name,
  phone: MEMBER.phone,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("signupMember", () => {
  it("검증한 본문으로 가입하고 회원과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.signup).mockResolvedValue({
      status: 201,
      headers: HEADERS,
      data: {
        success: true,
        data: MEMBER,
        message: "회원가입을 완료했습니다.",
        error: null,
      },
    });

    await expect(signupMember(SIGNUP_BODY)).resolves.toEqual({
      data: MEMBER,
      message: "회원가입을 완료했습니다.",
    });
    expect(generated.signup).toHaveBeenCalledWith(SIGNUP_BODY);
  });

  it("비밀번호에 숫자가 없으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      signupMember({ ...SIGNUP_BODY, password: "password" }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.signup).not.toHaveBeenCalled();
  });
});

describe("loginMember", () => {
  it("401 응답이면 INVALID_CREDENTIALS 코드를 읽을 수 있는 오류를 던진다", async () => {
    vi.mocked(generated.login).mockResolvedValue({
      status: 401,
      headers: HEADERS,
      data: {
        success: false,
        data: null,
        message: null,
        error: {
          code: API_ERROR_CODES.invalidCredentials,
          message: "아이디 또는 비밀번호가 올바르지 않습니다.",
          fieldErrors: [],
        },
      },
    });

    const error = await loginMember({
      email: MEMBER.email,
      password: "wrong1234",
    }).catch((caught: unknown) => caught);

    expect(getApiError(error)?.code).toBe(API_ERROR_CODES.invalidCredentials);
  });
});

describe("fetchMe", () => {
  it("회원 정보에 필드가 빠졌으면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getMe).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: {
        success: true,
        data: { ...MEMBER, phone: undefined } as never,
        message: null,
        error: null,
      },
    });

    await expect(fetchMe()).rejects.toBeInstanceOf(ResponseValidationError);
  });
});
