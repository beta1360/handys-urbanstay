import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApiError } from "./api-error";
import * as generated from "./generated";
import { fetchHotels } from "./hotel";
import { ResponseValidationError } from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotels: vi.fn(),
}));

const HOTEL = {
  id: 1,
  name: "어반스테이 강남",
  address: "서울 강남구",
  roomCount: 12,
};

const HOTEL_PAGE = {
  items: [HOTEL],
  page: 0,
  size: 100,
  totalElements: 1,
  totalPages: 1,
};

const HEADERS = new Headers();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchHotels", () => {
  it("페이지 파라미터를 넘기고 스키마에 없는 필드를 버린 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: {
        success: true,
        data: { ...HOTEL_PAGE, items: [{ ...HOTEL, phone: "02-123-4567" }] },
        message: null,
        error: null,
      },
    } as never);

    await expect(fetchHotels({ page: 0, size: 100 })).resolves.toEqual(
      HOTEL_PAGE,
    );
    expect(generated.getHotels).toHaveBeenCalledWith({ page: 0, size: 100 });
  });

  it("성공 응답의 필드가 빠지면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue({
      status: 200,
      headers: HEADERS,
      data: {
        success: true,
        data: { ...HOTEL_PAGE, items: [{ id: 1, name: "어반스테이" }] },
        message: null,
        error: null,
      },
    } as never);

    await expect(fetchHotels({})).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it("2xx가 아닌 응답의 본문이 오류 형식이 아니면 서버 오류 정보 없이 오류를 던진다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue({
      status: 500,
      headers: HEADERS,
      data: "<html>Bad Gateway</html>",
    } as never);

    const error = await fetchHotels({}).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 500 });
    expect(getApiError(error)).toBeUndefined();
  });
});
