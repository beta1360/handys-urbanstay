import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApiError } from "./api-error";

const INVALID_CREDENTIALS_ERROR = {
  code: "INVALID_CREDENTIALS",
  message: "아이디 또는 비밀번호가 올바르지 않습니다.",
  fieldErrors: [],
};

function createAxiosError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getApiError", () => {
  it("본문이 오류 응답 형식인 AxiosError면 서버 오류 정보를 돌려준다", () => {
    const error = createAxiosError(401, {
      success: false,
      data: null,
      error: INVALID_CREDENTIALS_ERROR,
    });

    expect(getApiError(error)).toEqual(INVALID_CREDENTIALS_ERROR);
  });

  it("본문이 오류 응답 형식이 아니면 아무것도 돌려주지 않고 틀린 필드를 콘솔에 남긴다", () => {
    const error = createAxiosError(502, "<html>Bad Gateway</html>");

    expect(getApiError(error)).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), [
      "(root): invalid_type",
    ]);
  });

  it("AxiosError가 아니면 아무것도 돌려주지 않는다", () => {
    expect(getApiError(new Error("unknown"))).toBeUndefined();
  });

  it("응답이 없는 AxiosError면 아무것도 돌려주지 않는다", () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);

    expect(getApiError(error)).toBeUndefined();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
