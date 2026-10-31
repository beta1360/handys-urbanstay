import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import { fetchHotelMaster, hotelMasterQueryKey } from "./hotel-master";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotelMaster: vi.fn(),
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
