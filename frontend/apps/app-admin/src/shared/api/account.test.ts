import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMe, loginAccount, logoutAccount, meQueryKey } from "./account";
import { getGetMeQueryKey, getMe, login, logout } from "./generated";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const LOGIN_BODY = {
  loginId: "admin@urbanstay.com",
  password: "password1234",
} as const;

const ACCOUNT_RESPONSE = {
  success: true,
  data: { id: 1, loginId: "admin@urbanstay.com", name: "관리자" },
  error: null,
};

const ACCOUNT_RESPONSE_WITH_WRONG_ID = {
  ...ACCOUNT_RESPONSE,
  data: { ...ACCOUNT_RESPONSE.data, id: "1" },
};

const UNSUCCESSFUL_ACCOUNT_RESPONSES = [
  ["success가 false", { ...ACCOUNT_RESPONSE, success: false }],
  ["data가 null", { ...ACCOUNT_RESPONSE, data: null }],
] as const;

const LOGOUT_RESPONSE = { success: true, data: null, error: null };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("meQueryKey", () => {
  it("생성된 쿼리 키를 쓴다", () => {
    expect(meQueryKey()).toEqual(getGetMeQueryKey());
  });
});

describe("fetchMe", () => {
  it("signal을 넘기고 응답이 스키마와 맞으면 계정 정보를 돌려준다", async () => {
    vi.mocked(getMe).mockResolvedValue(ACCOUNT_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchMe({ signal })).resolves.toEqual(ACCOUNT_RESPONSE.data);
    expect(getMe).toHaveBeenCalledWith(undefined, signal);
  });

  it.each(UNSUCCESSFUL_ACCOUNT_RESPONSES)(
    "성공 응답의 %s면 응답 검증 오류를 던진다",
    async (_, response) => {
      vi.mocked(getMe).mockResolvedValue(response);

      await expect(fetchMe()).rejects.toBeInstanceOf(ResponseValidationError);
    },
  );

  it("응답이 스키마와 맞지 않으면 응답 검증 오류를 던진다", async () => {
    vi.mocked(getMe).mockResolvedValue(ACCOUNT_RESPONSE_WITH_WRONG_ID as never);

    await expect(fetchMe()).rejects.toBeInstanceOf(ResponseValidationError);
  });
});

describe("loginAccount", () => {
  it("요청 본문과 응답이 스키마와 맞으면 요청을 보내고 계정 정보를 돌려준다", async () => {
    vi.mocked(login).mockResolvedValue(ACCOUNT_RESPONSE);

    await expect(loginAccount(LOGIN_BODY)).resolves.toEqual(
      ACCOUNT_RESPONSE.data,
    );
    expect(login).toHaveBeenCalledWith(LOGIN_BODY);
  });

  it.each(UNSUCCESSFUL_ACCOUNT_RESPONSES)(
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

  it("응답이 스키마와 맞지 않으면 응답 검증 오류를 던진다", async () => {
    vi.mocked(login).mockResolvedValue(ACCOUNT_RESPONSE_WITH_WRONG_ID as never);

    await expect(loginAccount(LOGIN_BODY)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("logoutAccount", () => {
  it("응답이 스키마와 맞으면 값 없이 끝난다", async () => {
    vi.mocked(logout).mockResolvedValue(LOGOUT_RESPONSE);

    await expect(logoutAccount()).resolves.toBeUndefined();
  });

  it("응답이 스키마와 맞지 않으면 응답 검증 오류를 던진다", async () => {
    vi.mocked(logout).mockResolvedValue(ACCOUNT_RESPONSE as never);

    await expect(logoutAccount()).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("검증 실패 로그", () => {
  const bodyWithWrongPassword = {
    loginId: LOGIN_BODY.loginId,
    password: { value: LOGIN_BODY.password },
  } as never;

  it("개발 환경에서는 틀린 필드만 콘솔에 남기고 요청 값은 남기지 않는다", async () => {
    await expect(loginAccount(bodyWithWrongPassword)).rejects.toBeInstanceOf(
      RequestValidationError,
    );

    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), [
      "password: invalid_type",
    ]);
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain(LOGIN_BODY.loginId);
    expect(logged).not.toContain(LOGIN_BODY.password);
  });

  it("개발 환경이 아니면 콘솔에 남기지 않는다", async () => {
    vi.stubEnv("DEV", false);

    await expect(loginAccount(bodyWithWrongPassword)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
