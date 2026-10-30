import type { ApiError } from "@repo/admin-kit/api";
import { AxiosError, AxiosHeaders } from "axios";
import type { UseFormSetError } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { FORM_ALERT, showSubmitError } from "./submit-error";

type Values = { name: string; phone: string; master: { loginId: string } };

const FIELDS = ["name", "phone", "master.loginId"] as const;

const FIELD_OF_CODE = {
  [API_ERROR_CODES.loginIdDuplicated]: "master.loginId",
} as const;

function createApiError({
  code = "INVALID_INPUT",
  message = "입력값이 올바르지 않습니다.",
  fieldErrors = [],
}: Partial<ApiError>) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: {
        success: false,
        data: null,
        message: null,
        error: { code, message, fieldErrors },
      },
      status: 400,
      statusText: "",
      headers: {},
      config,
    },
  );
}

function show(error: unknown) {
  const setError = vi.fn<UseFormSetError<Values>>();
  showSubmitError<Values>(error, {
    fields: FIELDS,
    setError,
    fieldOfCode: FIELD_OF_CODE,
  });
  return setError.mock.calls;
}

describe("showSubmitError", () => {
  it("본문을 쓸 수 없는 오류는 일반 오류 문구를 알림으로 보여준다", () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);

    expect(show(error)).toEqual([
      [FORM_ALERT, { message: COMMON_MESSAGES.requestFailed }],
    ]);
  });

  it("fieldErrors는 폼에 있는 칸만 화면 순서로, 칸마다 첫 문구로 보여주고 첫 칸에만 초점을 옮긴다", () => {
    const error = createApiError({
      fieldErrors: [
        { field: "master.loginId", message: "아이디 첫 문구" },
        { field: "unknown", message: "알 수 없는 칸" },
        { field: "name", message: "이름 문구" },
        { field: "master.loginId", message: "아이디 둘째 문구" },
      ],
    });

    expect(show(error)).toEqual([
      ["name", { type: "server", message: "이름 문구" }, { shouldFocus: true }],
      [
        "master.loginId",
        { type: "server", message: "아이디 첫 문구" },
        { shouldFocus: false },
      ],
    ]);
  });

  it("칸 하나의 문제인 오류 코드는 그 칸에 서버 문구로 보여준다", () => {
    const error = createApiError({
      code: API_ERROR_CODES.loginIdDuplicated,
      message: "이미 쓰는 아이디입니다.",
    });

    expect(show(error)).toEqual([
      [
        "master.loginId",
        { type: "server", message: "이미 쓰는 아이디입니다." },
        { shouldFocus: true },
      ],
    ]);
  });

  it.each([
    {
      case: "폼에 없는 칸의 fieldErrors",
      code: "INVALID_INPUT",
      fieldErrors: [{ field: "unknown", message: "알 수 없는 칸" }],
    },
    {
      case: "칸과 묶이지 않는 오류 코드",
      code: API_ERROR_CODES.hotelDuplicated,
      fieldErrors: [],
    },
  ])(
    "$case는 서버 코드와 문구를 알림으로 보여준다",
    ({ code, fieldErrors }) => {
      const message = "서버 문구";
      const error = createApiError({ code, message, fieldErrors });

      expect(show(error)).toEqual([[FORM_ALERT, { type: code, message }]]);
    },
  );

  it.each([
    [
      "본문을 쓸 수 없는 오류",
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
      { code: undefined, message: COMMON_MESSAGES.requestFailed },
    ],
    [
      "칸과 묶이지 않는 오류 코드",
      createApiError({ code: API_ERROR_CODES.hotelDuplicated }),
      {
        code: API_ERROR_CODES.hotelDuplicated,
        message: "입력값이 올바르지 않습니다.",
      },
    ],
  ])("%s는 폼 알림을 세우고 onAlert로도 알린다", (_, error, alert) => {
    const setError = vi.fn<UseFormSetError<Values>>();
    const onAlert = vi.fn();

    showSubmitError<Values>(error, { fields: FIELDS, setError, onAlert });

    expect(setError).toHaveBeenCalledExactlyOnceWith(FORM_ALERT, {
      type: alert.code,
      message: alert.message,
    });
    expect(onAlert).toHaveBeenCalledExactlyOnceWith(alert);
  });

  it("로그인이 필요하다는 오류는 전역 오류 처리기가 맡으므로 폼 알림만 세우고 onAlert로 알리지 않는다", () => {
    const setError = vi.fn<UseFormSetError<Values>>();
    const onAlert = vi.fn();
    const error = createApiError({ code: API_ERROR_CODES.unauthorized });

    showSubmitError<Values>(error, { fields: FIELDS, setError, onAlert });

    expect(setError).toHaveBeenCalledOnce();
    expect(onAlert).not.toHaveBeenCalled();
  });
});
