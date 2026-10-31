import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import { fetchMe, loginAccount, logoutAccount } from "./account";
import { getMe, login, logout } from "./generated";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const LOGIN_BODY = {
  loginId: "master@urbanstay.com",
  password: "password1234",
} as const;

const ACCOUNT = {
  id: 1,
  loginId: "master@urbanstay.com",
  name: "홍길동",
  role: "MASTER",
  hotel: { id: 1, name: "어반스테이 강남" },
} as const;

const ACCOUNT_RESPONSE = {
  success: true,
  data: ACCOUNT,
  message: null,
  error: null,
};

const INVALID_ACCOUNT_RESPONSES = [
  ["success가 false", { ...ACCOUNT_RESPONSE, success: false }],
  ["data가 null", { ...ACCOUNT_RESPONSE, data: null }],
  [
    "역할이 정해진 값이 아님",
    { ...ACCOUNT_RESPONSE, data: { ...ACCOUNT, role: "ADMIN" } },
  ],
  [
    "호텔 정보가 빠짐",
    { ...ACCOUNT_RESPONSE, data: { ...ACCOUNT, hotel: undefined } },
  ],
] as const;

const LOGIN_MESSAGE = "로그인했습니다.";

const LOGIN_RESPONSE = { ...ACCOUNT_RESPONSE, message: LOGIN_MESSAGE };

const INVALID_LOGIN_RESPONSES = [
  ["data가 null", { ...LOGIN_RESPONSE, data: null }],
  ["message가 null", { ...LOGIN_RESPONSE, message: null }],
] as const;

const LOGOUT_MESSAGE = "로그아웃했습니다.";

const LOGOUT_RESPONSE = {
  success: true,
  data: null,
  message: LOGOUT_MESSAGE,
  error: null,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("fetchMe", () => {
  it("signal을 넘기고 응답이 스키마와 맞으면 호텔을 포함한 계정 정보를 돌려준다", async () => {
    vi.mocked(getMe).mockResolvedValue(ACCOUNT_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchMe({ signal })).resolves.toEqual(ACCOUNT);
    expect(getMe).toHaveBeenCalledWith(undefined, signal);
  });

  it.each(INVALID_ACCOUNT_RESPONSES)(
    "성공 응답의 %s면 응답 검증 오류를 던진다",
    async (_, response) => {
      vi.mocked(getMe).mockResolvedValue(response as never);

      await expect(fetchMe()).rejects.toBeInstanceOf(ResponseValidationError);
    },
  );
});

describe("loginAccount", () => {
  it("요청 본문과 응답이 스키마와 맞으면 요청을 보내고 계정 정보와 성공 문구를 돌려준다", async () => {
    vi.mocked(login).mockResolvedValue(LOGIN_RESPONSE);

    await expect(loginAccount(LOGIN_BODY)).resolves.toEqual({
      data: ACCOUNT,
      message: LOGIN_MESSAGE,
    });
    expect(login).toHaveBeenCalledExactlyOnceWith(LOGIN_BODY);
  });

  it.each(INVALID_LOGIN_RESPONSES)(
    "성공 응답의 %s면 응답 검증 오류를 던진다",
    async (_, response) => {
      vi.mocked(login).mockResolvedValue(response);

      await expect(loginAccount(LOGIN_BODY)).rejects.toBeInstanceOf(
        ResponseValidationError,
      );
    },
  );

  it("요청 본문이 스키마와 맞지 않으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      loginAccount({ loginId: "", password: "" }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(login).not.toHaveBeenCalled();
  });
});

describe("logoutAccount", () => {
  it("응답이 스키마와 맞으면 성공 문구를 돌려준다", async () => {
    vi.mocked(logout).mockResolvedValue(LOGOUT_RESPONSE);

    await expect(logoutAccount()).resolves.toEqual({
      message: LOGOUT_MESSAGE,
    });
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(logout).mockResolvedValue({ ...LOGOUT_RESPONSE, message: null });

    await expect(logoutAccount()).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});
