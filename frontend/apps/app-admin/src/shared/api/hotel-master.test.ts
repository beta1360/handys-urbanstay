import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  fetchHotelMaster,
  hotelMasterQueryKey,
  resetHotelMasterPassword,
  updateHotelMaster,
} from "./hotel-master";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelMaster: vi.fn(),
  updateHotelMaster: vi.fn(),
  resetHotelMasterPassword: vi.fn(),
}));

const HOTEL_ID = 1;

const MASTER = {
  id: 7,
  loginId: "master@example.com",
  name: "홍길동",
  version: 2,
};

const MASTER_RESPONSE = {
  success: true,
  data: MASTER,
  message: null,
  error: null,
};

const UPDATE_MESSAGE = "마스터 정보를 수정했습니다.";

const UPDATE_BODY = {
  loginId: MASTER.loginId,
  name: MASTER.name,
  version: MASTER.version,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("hotelMasterQueryKey", () => {
  it("생성된 마스터 조회 쿼리 키를 쓴다", () => {
    expect(hotelMasterQueryKey(HOTEL_ID)).toEqual(
      generated.getGetHotelMasterQueryKey(HOTEL_ID),
    );
  });
});

describe("fetchHotelMaster", () => {
  it("호텔 ID와 signal을 넘겨 마스터를 돌려준다", async () => {
    vi.mocked(generated.getHotelMaster).mockResolvedValue(MASTER_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchHotelMaster(HOTEL_ID, { signal })).resolves.toEqual(
      MASTER,
    );
    expect(generated.getHotelMaster).toHaveBeenCalledWith(
      HOTEL_ID,
      undefined,
      signal,
    );
  });

  it("호텔 ID가 정수가 아니면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(fetchHotelMaster(1.5)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getHotelMaster).not.toHaveBeenCalled();
  });

  it.each([
    ["성공 응답의 data가 null이면", { ...MASTER_RESPONSE, data: null }],
    [
      "응답의 필드가 빠지면",
      { ...MASTER_RESPONSE, data: { ...MASTER, version: undefined } },
    ],
  ])("%s 응답 검증 오류를 던진다", async (_, response) => {
    vi.mocked(generated.getHotelMaster).mockResolvedValue(response as never);

    await expect(fetchHotelMaster(HOTEL_ID)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it("응답에 스키마에 없는 필드가 있으면 버린다", async () => {
    vi.mocked(generated.getHotelMaster).mockResolvedValue({
      ...MASTER_RESPONSE,
      data: { ...MASTER, password: "hidden" },
    } as never);

    await expect(fetchHotelMaster(HOTEL_ID)).resolves.toEqual(MASTER);
  });
});

describe("updateHotelMaster", () => {
  it("호텔 ID와 검증한 본문을 보내고 수정한 마스터와 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateHotelMaster).mockResolvedValue({
      ...MASTER_RESPONSE,
      message: UPDATE_MESSAGE,
    });

    await expect(updateHotelMaster(HOTEL_ID, UPDATE_BODY)).resolves.toEqual({
      data: MASTER,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateHotelMaster).toHaveBeenCalledWith(
      HOTEL_ID,
      UPDATE_BODY,
    );
  });

  it.each([
    ["아이디가 이메일 형식이 아니면", { ...UPDATE_BODY, loginId: "master" }],
    ["version이 정수가 아니면", { ...UPDATE_BODY, version: 0.5 }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, body) => {
    await expect(updateHotelMaster(HOTEL_ID, body)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.updateHotelMaster).not.toHaveBeenCalled();
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.updateHotelMaster).mockResolvedValue(MASTER_RESPONSE);

    await expect(
      updateHotelMaster(HOTEL_ID, UPDATE_BODY),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });
});

describe("resetHotelMasterPassword", () => {
  const RESET_MESSAGE = "마스터 비밀번호를 재설정했습니다.";

  it("입력한 그대로의 비밀번호로 요청하고 성공 문구만 돌려준다", async () => {
    vi.mocked(generated.resetHotelMasterPassword).mockResolvedValue({
      success: true,
      data: null,
      message: RESET_MESSAGE,
      error: null,
    });
    const body = { password: " master123 " };

    await expect(resetHotelMasterPassword(HOTEL_ID, body)).resolves.toEqual({
      message: RESET_MESSAGE,
    });
    expect(generated.resetHotelMasterPassword).toHaveBeenCalledWith(
      HOTEL_ID,
      body,
    );
  });

  it("새 비밀번호가 규칙에 맞지 않으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      resetHotelMasterPassword(HOTEL_ID, { password: "password" }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.resetHotelMasterPassword).not.toHaveBeenCalled();
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.resetHotelMasterPassword).mockResolvedValue({
      success: true,
      data: null,
      message: null,
      error: null,
    });

    await expect(
      resetHotelMasterPassword(HOTEL_ID, { password: "master123" }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });
});
