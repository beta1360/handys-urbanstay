import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHotel, hotelListQueryKey, hotelQueryKey } from "@/shared/api";
import type { Hotel, HotelPage } from "@/shared/api";
import { cacheSavedHotel, refetchHotel } from "./hotel-query";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotel: vi.fn(),
}));

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 해운대",
  address: "부산광역시 해운대구 해운대로 456",
  phone: "051-123-4567",
  description: null,
  version: 3,
};

const LATEST_HOTEL: Hotel = { ...HOTEL, name: "어반스테이 오션", version: 4 };

const OTHER_HOTEL: Hotel = { ...HOTEL, id: 2 };

const EMPTY_HOTEL_PAGE: HotelPage = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

function isInvalidated(queryClient: QueryClient, queryKey: readonly unknown[]) {
  return queryClient.getQueryState(queryKey)?.isInvalidated;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("cacheSavedHotel", () => {
  it("저장한 호텔을 상세 캐시에 넣고 목록 전체만 무효화한다", () => {
    const queryClient = new QueryClient();
    const firstPageKey = hotelListQueryKey({ page: 0 });
    const searchedKey = hotelListQueryKey({ keyword: "해운대", page: 1 });
    queryClient.setQueryData(firstPageKey, EMPTY_HOTEL_PAGE);
    queryClient.setQueryData(searchedKey, EMPTY_HOTEL_PAGE);
    queryClient.setQueryData(hotelQueryKey(HOTEL.id), HOTEL);
    queryClient.setQueryData(hotelQueryKey(OTHER_HOTEL.id), OTHER_HOTEL);

    cacheSavedHotel(queryClient, LATEST_HOTEL);

    expect(queryClient.getQueryData(hotelQueryKey(HOTEL.id))).toEqual(
      LATEST_HOTEL,
    );
    expect(isInvalidated(queryClient, firstPageKey)).toBe(true);
    expect(isInvalidated(queryClient, searchedKey)).toBe(true);
    expect(isInvalidated(queryClient, hotelQueryKey(HOTEL.id))).toBe(false);
    expect(isInvalidated(queryClient, hotelQueryKey(OTHER_HOTEL.id))).toBe(
      false,
    );
  });
});

describe("refetchHotel", () => {
  it("상세 캐시가 신선해도 서버에서 새로 조회해 캐시를 바꾼다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    });
    queryClient.setQueryData(hotelQueryKey(HOTEL.id), HOTEL);
    vi.mocked(fetchHotel).mockResolvedValue(LATEST_HOTEL);

    await expect(refetchHotel(queryClient, HOTEL.id)).resolves.toEqual(
      LATEST_HOTEL,
    );
    expect(fetchHotel).toHaveBeenCalledExactlyOnceWith(HOTEL.id, {
      signal: expect.any(AbortSignal),
    });
    expect(queryClient.getQueryData(hotelQueryKey(HOTEL.id))).toEqual(
      LATEST_HOTEL,
    );
  });

  it("진행 중인 조회를 취소한 뒤 새로 조회한다", async () => {
    const queryClient = new QueryClient();
    vi.mocked(fetchHotel)
      .mockReturnValueOnce(new Promise<never>(() => {}))
      .mockResolvedValueOnce(LATEST_HOTEL);
    const inFlight = refetchHotel(queryClient, HOTEL.id).catch(() => {});
    await vi.waitFor(() => {
      expect(fetchHotel).toHaveBeenCalledOnce();
    });

    await expect(refetchHotel(queryClient, HOTEL.id)).resolves.toEqual(
      LATEST_HOTEL,
    );
    expect(fetchHotel).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchHotel).mock.calls[0][1]?.signal?.aborted).toBe(true);
    await inFlight;
  });
});
