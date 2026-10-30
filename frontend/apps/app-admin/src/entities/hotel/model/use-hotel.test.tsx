import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { useHotel } from "./use-hotel";
import type { HotelState } from "./use-hotel";

const { useHotelQuery } = vi.hoisted(() => ({ useHotelQuery: vi.fn() }));

vi.mock("../api/hotel-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/hotel-query")>()),
  useHotelQuery,
}));

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 해운대",
  address: "부산광역시 해운대구 해운대로 456",
  phone: "051-123-4567",
  description: "바다가 보이는 호텔입니다.",
  version: 3,
};

const refetch = vi.fn();

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    error: { code, message: "요청을 처리하지 못했습니다.", fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function createServerError() {
  return createApiError(500, "INTERNAL_SERVER_ERROR");
}

function renderUseHotel(data: Hotel | undefined, error: Error | null) {
  useHotelQuery.mockReturnValue({ data, error, refetch });
  return renderHook(() => useHotel(HOTEL.id)).result;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useHotel", () => {
  it.each<[string, Hotel | undefined, Error | null, HotelState]>([
    [
      "데이터가 있으면 내용 상태다",
      HOTEL,
      null,
      { status: "ready", hotel: HOTEL },
    ],
    [
      "데이터가 있으면 다시 조회가 실패해도 내용 상태다",
      HOTEL,
      createServerError(),
      { status: "ready", hotel: HOTEL },
    ],
    [
      "데이터 없이 호텔이 없다는 404면 찾을 수 없음 상태다",
      undefined,
      createApiError(404, API_ERROR_CODES.hotelNotFound),
      { status: "notFound" },
    ],
    [
      "데이터 없이 그 밖의 오류면 불러오기 실패 상태다",
      undefined,
      createServerError(),
      { status: "failed", retry: expect.any(Function) },
    ],
    [
      "데이터와 오류가 아직 없으면 불러오는 중 상태다",
      undefined,
      null,
      { status: "loading" },
    ],
  ])("%s", (_, data, error, expected) => {
    const result = renderUseHotel(data, error);

    expect(result.current).toEqual(expected);
    expect(useHotelQuery).toHaveBeenCalledWith(HOTEL.id);
  });

  it("불러오기 실패 상태에서 다시 시도하면 다시 조회한다", () => {
    const result = renderUseHotel(undefined, createServerError());
    assert(result.current.status === "failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledOnce();
  });
});
