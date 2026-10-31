import type { UseFormSetError } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { COMMON_API_ERROR_CODES } from "../api";
import type { ApiError } from "../api";
import { FORM_ALERT_MESSAGES } from "../config";
import { FORM_ALERT, showSubmitError } from "./submit-error";

type Values = { name: string; phone: string; master: { loginId: string } };

const FIELDS = ["name", "phone", "master.loginId"] as const;

const LOGIN_ID_DUPLICATED = "LOGIN_ID_DUPLICATED";

const HOTEL_DUPLICATED = "HOTEL_DUPLICATED";

const FIELD_OF_CODE = {
  [LOGIN_ID_DUPLICATED]: "master.loginId",
} as const;

function createApiError({
  code = "INVALID_INPUT",
  message = "입력값이 올바르지 않습니다.",
  fieldErrors = [],
}: Partial<ApiError>): ApiError {
  return { code, message, fieldErrors };
}

function show(apiError: ApiError | undefined) {
  const setError = vi.fn<UseFormSetError<Values>>();
  showSubmitError<Values>(apiError, {
    fields: FIELDS,
    setError,
    fieldOfCode: FIELD_OF_CODE,
  });
  return setError.mock.calls;
}

describe("showSubmitError", () => {
  it("서버 오류 정보가 없으면(본문을 쓸 수 없는 오류) 일반 오류 문구를 알림으로 보여준다", () => {
    expect(show(undefined)).toEqual([
      [FORM_ALERT, { message: FORM_ALERT_MESSAGES.requestFailed }],
    ]);
  });

  it("fieldErrors는 폼에 있는 칸만 화면 순서로, 칸마다 첫 문구로 보여주고 첫 칸에만 초점을 옮긴다", () => {
    const apiError = createApiError({
      fieldErrors: [
        { field: "master.loginId", message: "아이디 첫 문구" },
        { field: "unknown", message: "알 수 없는 칸" },
        { field: "name", message: "이름 문구" },
        { field: "master.loginId", message: "아이디 둘째 문구" },
      ],
    });

    expect(show(apiError)).toEqual([
      ["name", { type: "server", message: "이름 문구" }, { shouldFocus: true }],
      [
        "master.loginId",
        { type: "server", message: "아이디 첫 문구" },
        { shouldFocus: false },
      ],
    ]);
  });

  it("칸 하나의 문제인 오류 코드는 그 칸에 서버 문구로 보여준다", () => {
    const apiError = createApiError({
      code: LOGIN_ID_DUPLICATED,
      message: "이미 쓰는 아이디입니다.",
    });

    expect(show(apiError)).toEqual([
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
      code: HOTEL_DUPLICATED,
      fieldErrors: [],
    },
  ])(
    "$case는 서버 코드와 문구를 알림으로 보여준다",
    ({ code, fieldErrors }) => {
      const message = "서버 문구";
      const apiError = createApiError({ code, message, fieldErrors });

      expect(show(apiError)).toEqual([[FORM_ALERT, { type: code, message }]]);
    },
  );

  it.each([
    [
      "서버 오류 정보가 없는 오류",
      undefined,
      { code: undefined, message: FORM_ALERT_MESSAGES.requestFailed },
    ],
    [
      "칸과 묶이지 않는 오류 코드",
      createApiError({ code: HOTEL_DUPLICATED }),
      {
        code: HOTEL_DUPLICATED,
        message: "입력값이 올바르지 않습니다.",
      },
    ],
  ])("%s는 폼 알림을 세우고 onAlert로도 알린다", (_, apiError, alert) => {
    const setError = vi.fn<UseFormSetError<Values>>();
    const onAlert = vi.fn();

    showSubmitError<Values>(apiError, { fields: FIELDS, setError, onAlert });

    expect(setError).toHaveBeenCalledExactlyOnceWith(FORM_ALERT, {
      type: alert.code,
      message: alert.message,
    });
    expect(onAlert).toHaveBeenCalledExactlyOnceWith(alert);
  });

  it("로그인이 필요하다는 오류는 전역 오류 처리기가 맡으므로 폼 알림만 세우고 onAlert로 알리지 않는다", () => {
    const setError = vi.fn<UseFormSetError<Values>>();
    const onAlert = vi.fn();
    const apiError = createApiError({
      code: COMMON_API_ERROR_CODES.unauthorized,
    });

    showSubmitError<Values>(apiError, { fields: FIELDS, setError, onAlert });

    expect(setError).toHaveBeenCalledOnce();
    expect(onAlert).not.toHaveBeenCalled();
  });
});
