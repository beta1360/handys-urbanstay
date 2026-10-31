import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  createOperator,
  fetchOperator,
  fetchOperators,
  resetOperatorPassword,
  updateOperator,
  updateOperatorActive,
} from "./operator";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelOperators: vi.fn(),
  getHotelOperator: vi.fn(),
  createHotelOperator: vi.fn(),
  updateHotelOperator: vi.fn(),
  resetHotelOperatorPassword: vi.fn(),
  updateHotelOperatorActive: vi.fn(),
}));

const OPERATOR_ID = 3;

const OPERATOR = {
  id: OPERATOR_ID,
  loginId: "operator@example.com",
  name: "김운영",
  active: true,
  version: 2,
};

const OPERATOR_RESPONSE = {
  success: true,
  data: OPERATOR,
  message: null,
  error: null,
};

const OPERATOR_PAGE = {
  items: [OPERATOR],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

const CHANGE_MESSAGE = "운영자 정보를 바꿨습니다.";

const PASSWORD = "operator123";

const CREATE_BODY = {
  loginId: OPERATOR.loginId,
  name: OPERATOR.name,
  password: PASSWORD,
};

const UPDATE_BODY = {
  loginId: OPERATOR.loginId,
  name: OPERATOR.name,
  version: OPERATOR.version,
};

const OPERATOR_CHANGE_OPERATIONS = [
  {
    name: "createOperator",
    mock: vi.mocked(generated.createHotelOperator),
    run: () => createOperator(CREATE_BODY),
    calledWith: [CREATE_BODY],
  },
  {
    name: "updateOperator",
    mock: vi.mocked(generated.updateHotelOperator),
    run: () => updateOperator(OPERATOR_ID, UPDATE_BODY),
    calledWith: [OPERATOR_ID, UPDATE_BODY],
  },
  {
    name: "updateOperatorActive",
    mock: vi.mocked(generated.updateHotelOperatorActive),
    run: () => updateOperatorActive(OPERATOR_ID, { active: false }),
    calledWith: [OPERATOR_ID, { active: false }],
  },
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchOperators", () => {
  it("검색어·사용 여부·페이지와 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getHotelOperators).mockResolvedValue({
      ...OPERATOR_RESPONSE,
      data: OPERATOR_PAGE,
    });
    const params = { keyword: "김", active: false, page: 1, size: 10 };
    const { signal } = new AbortController();

    await expect(fetchOperators(params, { signal })).resolves.toEqual(
      OPERATOR_PAGE,
    );
    expect(generated.getHotelOperators).toHaveBeenCalledWith(
      params,
      undefined,
      signal,
    );
  });

  it("사용 여부가 불리언이 아니면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      fetchOperators({ active: "true" as unknown as boolean }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.getHotelOperators).not.toHaveBeenCalled();
  });
});

describe("fetchOperator", () => {
  it("운영자 ID와 signal을 넘겨 운영자를 돌려준다", async () => {
    vi.mocked(generated.getHotelOperator).mockResolvedValue(OPERATOR_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchOperator(OPERATOR_ID, { signal })).resolves.toEqual(
      OPERATOR,
    );
    expect(generated.getHotelOperator).toHaveBeenCalledWith(
      OPERATOR_ID,
      undefined,
      signal,
    );
  });

  it.each([
    ["success가 false면", { success: false }],
    ["data가 null이면", { data: null }],
    ["사용 여부가 빠지면", { data: { ...OPERATOR, active: undefined } }],
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, override) => {
    vi.mocked(generated.getHotelOperator).mockResolvedValue({
      ...OPERATOR_RESPONSE,
      ...override,
    } as never);

    await expect(fetchOperator(OPERATOR_ID)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe.each(OPERATOR_CHANGE_OPERATIONS)(
  "$name",
  ({ mock, run, calledWith }) => {
    it("검증한 값으로 요청하고 운영자와 성공 문구를 돌려준다", async () => {
      mock.mockResolvedValue({ ...OPERATOR_RESPONSE, message: CHANGE_MESSAGE });

      await expect(run()).resolves.toEqual({
        data: OPERATOR,
        message: CHANGE_MESSAGE,
      });
      expect(mock).toHaveBeenCalledWith(...calledWith);
    });

    it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
      mock.mockResolvedValue(OPERATOR_RESPONSE);

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });
  },
);

describe("resetOperatorPassword", () => {
  it("입력한 그대로의 비밀번호로 요청하고 성공 문구만 돌려준다", async () => {
    vi.mocked(generated.resetHotelOperatorPassword).mockResolvedValue({
      success: true,
      data: null,
      message: CHANGE_MESSAGE,
      error: null,
    });
    const body = { password: ` ${PASSWORD} ` };

    await expect(resetOperatorPassword(OPERATOR_ID, body)).resolves.toEqual({
      message: CHANGE_MESSAGE,
    });
    expect(generated.resetHotelOperatorPassword).toHaveBeenCalledWith(
      OPERATOR_ID,
      body,
    );
  });
});

describe("요청 검증", () => {
  it.each([
    [
      "아이디가 이메일 형식이 아니면",
      () => createOperator({ ...CREATE_BODY, loginId: "operator" }),
    ],
    [
      "비밀번호에 숫자가 없으면",
      () => createOperator({ ...CREATE_BODY, password: "operatorpw" }),
    ],
    [
      "새 비밀번호가 8자보다 짧으면",
      () => resetOperatorPassword(OPERATOR_ID, { password: "op123" }),
    ],
    [
      "version이 정수가 아니면",
      () => updateOperator(OPERATOR_ID, { ...UPDATE_BODY, version: 0.5 }),
    ],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, run) => {
    await expect(run()).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.createHotelOperator).not.toHaveBeenCalled();
    expect(generated.updateHotelOperator).not.toHaveBeenCalled();
    expect(generated.resetHotelOperatorPassword).not.toHaveBeenCalled();
  });
});
