import { renderHook } from "@testing-library/react";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import type { Hotel, HotelPage } from "@/shared/api";
import { useHotelList } from "./use-hotel-list";
import type { HotelListCriteria, HotelListState } from "./use-hotel-list";

const { navigate, useHotelListQuery } = vi.hoisted(() => ({
  navigate: vi.fn(),
  useHotelListQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
}));

vi.mock("@/entities/hotel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/hotel")>()),
  useHotelListQuery,
}));

const HOTELS: Hotel[] = [
  {
    id: 1,
    name: "어반스테이 해운대",
    address: "부산광역시 해운대구 해운대로 456",
    phone: "051-123-4567",
    description: null,
    version: 0,
  },
];

const KEYWORD = "강남";

const refetch = vi.fn();

function createHotelPage(overrides: Partial<HotelPage> = {}): HotelPage {
  return {
    items: HOTELS,
    page: 0,
    size: 10,
    totalElements: HOTELS.length,
    totalPages: 1,
    ...overrides,
  };
}

const EMPTY_HOTEL_PAGE = createHotelPage({
  items: [],
  totalElements: 0,
  totalPages: 0,
});

type QueryResult = {
  data?: HotelPage;
  isError?: boolean;
  isPlaceholderData?: boolean;
};

function renderUseHotelList(
  criteria: HotelListCriteria,
  { data, isError = false, isPlaceholderData = false }: QueryResult,
) {
  useHotelListQuery.mockReturnValue({
    data,
    isError,
    isPlaceholderData,
    refetch,
  });
  return renderHook(() => useHotelList(criteria)).result;
}

function readyState(
  page: number,
  totalPages: number,
  { hasPrevious = false, hasNext = false, isUpdating = false } = {},
): HotelListState {
  return {
    status: "ready",
    hotels: HOTELS,
    isUpdating,
    pagination: {
      page,
      totalPages,
      hasPrevious,
      hasNext,
      goToPreviousPage: expect.any(Function),
      goToNextPage: expect.any(Function),
    },
  };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("useHotelList", () => {
  it.each<[string, HotelListCriteria, QueryResult, HotelListState]>([
    [
      "데이터와 오류가 아직 없으면 불러오는 중 상태다",
      { keyword: undefined, page: 1 },
      {},
      { status: "loading" },
    ],
    [
      "데이터 없이 실패하면 불러오기 실패 상태다",
      { keyword: undefined, page: 1 },
      { isError: true },
      { status: "failed", retry: expect.any(Function) },
    ],
    [
      "검색어 없이 항목이 없으면 검색어가 없는 빈 상태다",
      { keyword: undefined, page: 1 },
      { data: EMPTY_HOTEL_PAGE },
      { status: "empty", hasKeyword: false },
    ],
    [
      "검색어가 있는데 항목이 없으면 검색어가 있는 빈 상태다",
      { keyword: KEYWORD, page: 1 },
      { data: EMPTY_HOTEL_PAGE },
      { status: "empty", hasKeyword: true },
    ],
    [
      "1페이지면 이전으로 갈 수 없고 다음으로 갈 수 있는 목록 상태다",
      { keyword: undefined, page: 1 },
      { data: createHotelPage({ totalPages: 3 }) },
      readyState(1, 3, { hasNext: true }),
    ],
    [
      "마지막 페이지면 다음으로 갈 수 없는 목록 상태다",
      { keyword: KEYWORD, page: 3 },
      { data: createHotelPage({ page: 2, totalPages: 3 }) },
      readyState(3, 3, { hasPrevious: true }),
    ],
    [
      "전체 페이지가 100을 넘어도 100페이지면 다음으로 갈 수 없는 목록 상태다",
      { keyword: undefined, page: 100 },
      { data: createHotelPage({ page: 99, totalPages: 150 }) },
      readyState(100, 150, { hasPrevious: true }),
    ],
    [
      "다른 페이지를 불러오는 동안 이전 목록이면 옮기는 중인 목록 상태다",
      { keyword: undefined, page: 2 },
      { data: createHotelPage({ totalPages: 3 }), isPlaceholderData: true },
      readyState(2, 3, { hasPrevious: true, hasNext: true, isUpdating: true }),
    ],
    [
      "데이터가 있으면 다시 조회가 실패해도 목록 상태다",
      { keyword: undefined, page: 1 },
      { data: createHotelPage(), isError: true },
      readyState(1, 1),
    ],
  ])("%s", (_, criteria, queryResult, expected) => {
    const result = renderUseHotelList(criteria, queryResult);

    expect(result.current).toEqual(expected);
    expect(useHotelListQuery).toHaveBeenCalledWith({
      keyword: criteria.keyword,
      page: criteria.page - 1,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("불러오기 실패 상태에서 다시 시도하면 다시 조회한다", () => {
    const result = renderUseHotelList(
      { keyword: undefined, page: 1 },
      { isError: true },
    );
    assert(result.current.status === "failed");

    result.current.retry();

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("마지막 페이지를 넘은 응답이면 불러오는 중 상태로 두고 검색어를 유지한 채 마지막 페이지로 방문 기록을 바꿔 이동한다", () => {
    const result = renderUseHotelList(
      { keyword: KEYWORD, page: 50 },
      { data: createHotelPage({ items: [], page: 49, totalPages: 2 }) },
    );

    expect(result.current).toEqual({ status: "loading" });
    expect(navigate).toHaveBeenCalledExactlyOnceWith({
      to: "/hotels",
      search: { keyword: KEYWORD, page: 2 },
      replace: true,
    });
  });
});
