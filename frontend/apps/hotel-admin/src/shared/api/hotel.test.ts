import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import { fetchHotel, updateHotel } from "./hotel";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotel: vi.fn(),
  updateHotel: vi.fn(),
}));

const HOTEL = {
  id: 1,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: null,
  version: 2,
};

const UPDATE_BODY = {
  name: HOTEL.name,
  address: HOTEL.address,
  phone: HOTEL.phone,
  description: null,
  version: HOTEL.version,
};

const UPDATE_MESSAGE = "호텔 정보를 수정했습니다.";

function successResponse(data: unknown, message: string | null = null) {
  return { success: true, data, message, error: null };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("fetchHotel", () => {
  it("signal을 넘겨 호텔 정보를 그대로 돌려준다", async () => {
    vi.mocked(generated.getHotel).mockResolvedValue(
      successResponse(HOTEL) as never,
    );
    const { signal } = new AbortController();

    await expect(fetchHotel({ signal })).resolves.toEqual(HOTEL);
    expect(generated.getHotel).toHaveBeenCalledWith(undefined, signal);
  });

  it("version이 없으면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getHotel).mockResolvedValue(
      successResponse({ ...HOTEL, version: undefined }) as never,
    );

    await expect(fetchHotel()).rejects.toBeInstanceOf(ResponseValidationError);
  });
});

describe("updateHotel", () => {
  it("version을 담은 본문을 보내고 수정한 호텔과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateHotel).mockResolvedValue(
      successResponse(HOTEL, UPDATE_MESSAGE) as never,
    );

    await expect(updateHotel(UPDATE_BODY)).resolves.toEqual({
      data: HOTEL,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateHotel).toHaveBeenCalledWith(UPDATE_BODY);
  });

  it("전화번호 형식이 틀리면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      updateHotel({ ...UPDATE_BODY, phone: "02-123" }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.updateHotel).not.toHaveBeenCalled();
  });
});
