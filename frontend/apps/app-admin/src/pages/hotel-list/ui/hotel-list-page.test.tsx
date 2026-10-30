import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  stripSearchParams,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";
import { HOTEL_FIELD_LABELS } from "@/entities/hotel";
import type { Hotel, HotelPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HOTEL_LIST_MESSAGES } from "../config/messages";
import {
  HOTEL_LIST_DEFAULT_SEARCH,
  hotelListSearchSchema,
} from "../model/hotel-list-search";
import { HotelListPage } from "./hotel-list-page";

const { fetchHotels } = vi.hoisted(() => ({ fetchHotels: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchHotels: (params: Parameters<typeof actual.fetchHotels>[0]) =>
      fetchHotels(params),
  };
});

const HOTELS: Hotel[] = [
  {
    id: 2,
    name: "어반스테이 강남",
    address: "서울특별시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    description: null,
    version: 0,
  },
  {
    id: 1,
    name: "어반스테이 해운대",
    address: "부산광역시 해운대구 해운대로 456",
    phone: "051-123-4567",
    description: "바다가 보이는 호텔입니다.",
    version: 3,
  },
];

const KEYWORD = "강남";

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

function hotelsPath(search: Record<string, string> = {}) {
  const searchString = new URLSearchParams(search).toString();
  return searchString ? `/hotels?${searchString}` : "/hotels";
}

function renderHotelListPage(initialPath = hotelsPath()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const hotelListRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/",
    validateSearch: hotelListSearchSchema,
    search: { middlewares: [stripSearchParams(HOTEL_LIST_DEFAULT_SEARCH)] },
    component: HotelListPage,
  });
  const hotelCreateRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/new",
  });
  const hotelDetailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/$hotelId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        hotelListRoute,
        hotelCreateRoute,
        hotelDetailRoute,
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

function findKeywordInput() {
  return screen.findByLabelText(HOTEL_LIST_MESSAGES.keywordLabel);
}

function getSearchButton() {
  return screen.getByRole("button", { name: HOTEL_LIST_MESSAGES.search });
}

function getPreviousButton() {
  return screen.getByRole("button", { name: HOTEL_LIST_MESSAGES.previousPage });
}

function getNextButton() {
  return screen.getByRole("button", { name: HOTEL_LIST_MESSAGES.nextPage });
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function recordAddedText(text: string) {
  let isAdded = false;
  const checkRecords = (records: MutationRecord[]) => {
    isAdded ||= records.some((record) =>
      (record.type === "characterData"
        ? [record.target]
        : Array.from(record.addedNodes)
      ).some((node) => node.textContent?.includes(text)),
    );
  };
  const observer = new MutationObserver(checkRecords);
  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  onTestFinished(() => observer.disconnect());
  return () => {
    checkRecords(observer.takeRecords());
    return isAdded;
  };
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchHotels.mockResolvedValue(createHotelPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("HotelListPage 목록", () => {
  it("호텔 목록을 이름·주소·대표 전화번호 열의 표로 보여준다", async () => {
    renderHotelListPage();

    const table = await screen.findByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      HOTEL_FIELD_LABELS.name,
      HOTEL_FIELD_LABELS.address,
      HOTEL_FIELD_LABELS.phone,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual(
      HOTELS.map((hotel) => [hotel.name, hotel.address, hotel.phone]),
    );
    expect(table).not.toHaveAttribute("aria-busy");
    expect(
      screen.getByText(HOTEL_LIST_MESSAGES.pageStatus(1, 1)),
    ).toBeInTheDocument();
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("호텔 이름은 그 호텔의 상세 화면으로 가는 링크다", async () => {
    const user = userEvent.setup();
    const router = renderHotelListPage(hotelsPath({ keyword: KEYWORD }));

    const nameLink = await screen.findByRole("link", { name: HOTELS[0].name });
    expect(nameLink).toHaveAttribute("href", `/hotels/${HOTELS[0].id}`);

    await user.click(nameLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(`/hotels/${HOTELS[0].id}`);
    });
  });

  it("호텔 등록 버튼을 누르면 호텔 등록 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = renderHotelListPage(hotelsPath({ keyword: KEYWORD }));

    const createLink = await screen.findByRole("link", {
      name: HOTEL_LIST_MESSAGES.create,
    });
    expect(createLink).toHaveAttribute("href", "/hotels/new");

    await user.click(createLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels/new");
    });
  });

  it("처음 불러오는 동안 불러오는 중 문구를 보여준다", async () => {
    fetchHotels.mockReturnValue(new Promise<never>(() => {}));
    renderHotelListPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("URL의 검색어와 페이지로 처음 조회하고 API에는 0부터 센 페이지를 보낸다", async () => {
    fetchHotels.mockResolvedValue(createHotelPage({ page: 2, totalPages: 5 }));
    renderHotelListPage(hotelsPath({ keyword: KEYWORD, page: "3" }));

    expect(
      await screen.findByText(HOTEL_LIST_MESSAGES.pageStatus(3, 5)),
    ).toBeInTheDocument();
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({
      keyword: KEYWORD,
      page: 2,
    });
  });
});

describe("HotelListPage 검색", () => {
  it.each([
    ["검색 버튼을 누르면", (user: UserEvent) => user.click(getSearchButton())],
    ["검색창에서 Enter를 누르면", (user: UserEvent) => user.keyboard("{Enter}")],
  ])("%s 앞뒤 공백을 지운 검색어로 1페이지를 조회한다", async (_, submit) => {
    const user = userEvent.setup();
    fetchHotels.mockResolvedValue(createHotelPage({ totalPages: 3 }));
    const router = renderHotelListPage(hotelsPath({ page: "2" }));

    await user.type(await findKeywordInput(), `  ${KEYWORD}  `);
    await submit(user);

    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({ keyword: KEYWORD });
    });
    expect(fetchHotels).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 0 });
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
  });

  it("입력하는 동안에는 검색하지 않는다", async () => {
    const user = userEvent.setup();
    const router = renderHotelListPage();

    await screen.findByRole("table");
    await user.type(await findKeywordInput(), KEYWORD);

    expect(fetchHotels).toHaveBeenCalledOnce();
    expect(router.state.location.search).toEqual({});
  });

  it("공백만 입력해 검색하면 검색어 없이 조회하고 검색창을 비운다", async () => {
    const user = userEvent.setup();
    const router = renderHotelListPage(hotelsPath({ keyword: KEYWORD }));

    const keywordInput = await findKeywordInput();
    await user.clear(keywordInput);
    await user.type(keywordInput, "   {Enter}");

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(hotelsPath());
    });
    expect(fetchHotels).toHaveBeenLastCalledWith({ page: 0 });
    expect(keywordInput).toHaveValue("");
  });

  it("검색창에는 100자까지만 입력된다", async () => {
    const user = userEvent.setup();
    renderHotelListPage();

    const keywordInput = await findKeywordInput();
    await user.click(keywordInput);
    await user.paste("a".repeat(101));

    expect(keywordInput).toHaveValue("a".repeat(100));
  });
});

describe("HotelListPage 페이지 이동", () => {
  it("다음 버튼을 누르면 다음 페이지를 조회하고 그동안 이전 목록을 흐리게 보여준다", async () => {
    const user = userEvent.setup();
    fetchHotels
      .mockResolvedValueOnce(createHotelPage({ totalPages: 3 }))
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const router = renderHotelListPage();

    await screen.findByRole("table");
    await user.click(getNextButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(hotelsPath({ page: "2" }));
    });
    expect(fetchHotels).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(HOTELS[0].name)).toBeInTheDocument();
    expect(
      screen.getByText(HOTEL_LIST_MESSAGES.pageStatus(2, 3)),
    ).toBeInTheDocument();
  });

  it("이전 버튼을 누르면 검색어를 유지한 채 이전 페이지를 조회한다", async () => {
    const user = userEvent.setup();
    fetchHotels.mockResolvedValue(createHotelPage({ page: 1, totalPages: 3 }));
    const router = renderHotelListPage(
      hotelsPath({ keyword: KEYWORD, page: "2" }),
    );

    await screen.findByRole("table");
    await user.click(getPreviousButton());

    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({ keyword: KEYWORD });
    });
    expect(fetchHotels).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 0 });
  });

  it("1페이지에서는 이전 버튼을 누를 수 없다", async () => {
    fetchHotels.mockResolvedValue(createHotelPage({ totalPages: 3 }));
    renderHotelListPage();

    await screen.findByRole("table");
    expect(getPreviousButton()).toBeDisabled();
    expect(getNextButton()).toBeEnabled();
  });

  it("마지막 페이지에서는 다음 버튼을 누를 수 없다", async () => {
    fetchHotels.mockResolvedValue(createHotelPage({ page: 2, totalPages: 3 }));
    renderHotelListPage(hotelsPath({ page: "3" }));

    await screen.findByRole("table");
    expect(getPreviousButton()).toBeEnabled();
    expect(getNextButton()).toBeDisabled();
  });

  it("전체 페이지가 100을 넘어도 100페이지에서는 다음 버튼을 누를 수 없다", async () => {
    fetchHotels.mockResolvedValue(
      createHotelPage({ page: 99, totalPages: 150 }),
    );
    renderHotelListPage(hotelsPath({ page: "100" }));

    await screen.findByRole("table");
    expect(getNextButton()).toBeDisabled();
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({ page: 99 });
  });
});

describe("HotelListPage 빈 상태", () => {
  it("검색어 없이 호텔이 없으면 등록된 호텔이 없다는 문구를 보여주고 페이지 이동은 감춘다", async () => {
    fetchHotels.mockResolvedValue(EMPTY_HOTEL_PAGE);
    renderHotelListPage();

    expect(
      await screen.findByText(HOTEL_LIST_MESSAGES.empty),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: HOTEL_LIST_MESSAGES.paginationLabel,
      }),
    ).not.toBeInTheDocument();
  });

  it("검색 결과가 없으면 검색 결과가 없다는 문구를 보여준다", async () => {
    fetchHotels.mockResolvedValue(EMPTY_HOTEL_PAGE);
    renderHotelListPage(hotelsPath({ keyword: KEYWORD }));

    expect(
      await screen.findByText(HOTEL_LIST_MESSAGES.emptySearchResult),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("HotelListPage 마지막 페이지를 넘은 페이지", () => {
  it("검색어를 유지한 채 마지막 페이지로 방문 기록을 바꿔 이동하고 그동안 빈 상태 문구 대신 불러오는 중 문구를 보여준다", async () => {
    const wasEmptyTextAdded = recordAddedText(
      HOTEL_LIST_MESSAGES.emptySearchResult,
    );
    const lastPage = createDeferred<HotelPage>();
    fetchHotels
      .mockResolvedValueOnce(
        createHotelPage({ items: [], page: 49, totalPages: 2 }),
      )
      .mockReturnValueOnce(lastPage.promise);
    const router = renderHotelListPage(
      hotelsPath({ keyword: KEYWORD, page: "50" }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        hotelsPath({ keyword: KEYWORD, page: "2" }),
      );
    });
    expect(router.history.length).toBe(1);
    expect(fetchHotels).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 1 });
    expect(screen.getByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );

    lastPage.resolve(createHotelPage({ page: 1, totalPages: 2 }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(
      screen.getByText(HOTEL_LIST_MESSAGES.pageStatus(2, 2)),
    ).toBeInTheDocument();
    expect(wasEmptyTextAdded()).toBe(false);
  });

  it("결과가 없으면 1페이지로 방문 기록을 바꿔 이동하고 URL에서 페이지를 지운다", async () => {
    fetchHotels.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve({ ...EMPTY_HOTEL_PAGE, page }),
    );
    const router = renderHotelListPage(hotelsPath({ page: "3" }));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(hotelsPath());
    });
    expect(
      await screen.findByText(HOTEL_LIST_MESSAGES.empty),
    ).toBeInTheDocument();
    expect(router.history.length).toBe(1);
    expect(fetchHotels).toHaveBeenLastCalledWith({ page: 0 });
  });
});

describe("HotelListPage 오류", () => {
  it("목록을 불러오지 못하면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchHotels
      .mockRejectedValueOnce(new Error("서버 오류"))
      .mockResolvedValueOnce(createHotelPage());
    renderHotelListPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      HOTEL_LIST_MESSAGES.loadFailed,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchHotels).toHaveBeenCalledTimes(2);
  });
});

describe("HotelListPage URL 정리", () => {
  it.each([
    ["숫자가 아니면", "abc"],
    ["1보다 작으면", "0"],
    ["음수면", "-1"],
    ["정수가 아니면", "1.5"],
    ["100보다 크면", "101"],
    ["1이면", "1"],
  ])("page가 %s 1페이지로 조회하고 URL에서 지운다", async (_, page) => {
    const router = renderHotelListPage(hotelsPath({ page }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(hotelsPath());
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it.each([
    ["공백만 있으면", "   "],
    ["100자를 넘으면", "가".repeat(101)],
  ])("검색어가 %s 검색 없이 조회하고 URL에서 지운다", async (_, keyword) => {
    const router = renderHotelListPage(hotelsPath({ keyword }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(hotelsPath());
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({ page: 0 });
    expect(await findKeywordInput()).toHaveValue("");
  });

  it.each([
    ["앞뒤 공백을 지운 값으로", ` ${KEYWORD} `, KEYWORD],
    ["숫자만 있어도 글자 그대로", "101", "101"],
  ])("URL 검색어는 %s 조회한다", async (_, keyword, expectedKeyword) => {
    const router = renderHotelListPage(hotelsPath({ keyword }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(
      hotelsPath({ keyword: expectedKeyword }),
    );
    expect(fetchHotels).toHaveBeenCalledExactlyOnceWith({
      keyword: expectedKeyword,
      page: 0,
    });
    expect(await findKeywordInput()).toHaveValue(expectedKeyword);
  });
});

describe("HotelListPage 방문 기록", () => {
  it("뒤로·앞으로 가면 검색창 값과 목록이 URL을 따라간다", async () => {
    const user = userEvent.setup();
    const router = renderHotelListPage();

    const keywordInput = await findKeywordInput();
    await user.type(keywordInput, `${KEYWORD}{Enter}`);
    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({ keyword: KEYWORD });
    });

    router.history.back();
    await vi.waitFor(() => {
      expect(keywordInput).toHaveValue("");
    });
    expect(router.state.location.href).toBe(hotelsPath());
    expect(fetchHotels).toHaveBeenLastCalledWith({ page: 0 });

    router.history.forward();
    await vi.waitFor(() => {
      expect(keywordInput).toHaveValue(KEYWORD);
    });
    expect(fetchHotels).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 0 });
  });
});
