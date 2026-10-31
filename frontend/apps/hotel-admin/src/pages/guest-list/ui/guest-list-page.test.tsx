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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUEST_FIELD_LABELS } from "@/entities/guest";
import { GUEST_SEARCH_FORM_MESSAGES } from "@/features/guest-search";
import type { Guest, GuestPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { GUEST_LIST_CONTENT_MESSAGES } from "@/widgets/guest-list";
import {
  GUEST_LIST_DEFAULT_SEARCH,
  guestListSearchSchema,
} from "../model/guest-list-search";
import { GuestListPage } from "./guest-list-page";

const { fetchGuests } = vi.hoisted(() => ({ fetchGuests: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchGuests: (params: Parameters<typeof actual.fetchGuests>[0]) =>
      fetchGuests(params),
  };
});

const GUESTS: Guest[] = [
  {
    id: 2,
    name: "김이용",
    phone: "010-1234-5678",
    email: "kim@example.com",
    version: 0,
  },
  {
    id: 1,
    name: "이숙박",
    phone: "01098765432",
    email: "lee@example.com",
    version: 2,
  },
];

const KEYWORD = "010";

function createGuestPage(overrides: Partial<GuestPage> = {}): GuestPage {
  return {
    items: GUESTS,
    page: 0,
    size: 10,
    totalElements: GUESTS.length,
    totalPages: 1,
    ...overrides,
  };
}

function guestsPath(search: Record<string, string> = {}) {
  const searchString = new URLSearchParams(search).toString();
  return searchString ? `/guests?${searchString}` : "/guests";
}

function renderGuestListPage(initialPath = guestsPath()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/",
          validateSearch: guestListSearchSchema,
          search: {
            middlewares: [stripSearchParams(GUEST_LIST_DEFAULT_SEARCH)],
          },
          component: GuestListPage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/$guestId",
        }),
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
  return screen.findByLabelText(GUEST_SEARCH_FORM_MESSAGES.keywordLabel);
}

function getPageButton(name: string) {
  return screen.getByRole("button", { name });
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchGuests.mockResolvedValue(createGuestPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GuestListPage 목록", () => {
  it("이용객 목록을 이름·전화번호·이메일 열의 표로 보여주고 1페이지를 조회한다", async () => {
    renderGuestListPage();

    const table = await screen.findByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      GUEST_FIELD_LABELS.name,
      GUEST_FIELD_LABELS.phone,
      GUEST_FIELD_LABELS.email,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual(
      GUESTS.map((guest) => [guest.name, guest.phone, guest.email]),
    );
    expect(
      screen.getByText(COMMON_MESSAGES.pageStatus(1, 1)),
    ).toBeInTheDocument();
    expect(fetchGuests).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("이름은 그 이용객의 상세 화면으로 가는 링크이고 등록 버튼은 없다", async () => {
    renderGuestListPage(guestsPath({ keyword: KEYWORD }));

    expect(
      await screen.findByRole("link", { name: GUESTS[0].name }),
    ).toHaveAttribute("href", `/guests/${GUESTS[0].id}`);
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).not.toContain("/guests/new");
  });

  it("URL의 검색어와 페이지로 조회하고 API에는 0부터 센 페이지를 보낸다", async () => {
    fetchGuests.mockResolvedValue(createGuestPage({ page: 2, totalPages: 5 }));
    renderGuestListPage(guestsPath({ keyword: KEYWORD, page: "3" }));

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(3, 5)),
    ).toBeInTheDocument();
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
    expect(fetchGuests).toHaveBeenCalledExactlyOnceWith({
      keyword: KEYWORD,
      page: 2,
    });
  });

  it.each([
    [
      "검색어 없이 이용객이 없으면",
      guestsPath(),
      GUEST_LIST_CONTENT_MESSAGES.empty,
    ],
    [
      "검색 결과가 없으면",
      guestsPath({ keyword: KEYWORD }),
      COMMON_MESSAGES.emptySearchResult,
    ],
  ])("%s 빈 상태 문구를 보여주고 표를 감춘다", async (_, path, message) => {
    fetchGuests.mockResolvedValue(
      createGuestPage({ items: [], totalElements: 0, totalPages: 0 }),
    );
    renderGuestListPage(path);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("목록을 불러오지 못하면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchGuests
      .mockRejectedValueOnce(new Error("서버 오류"))
      .mockResolvedValueOnce(createGuestPage());
    renderGuestListPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GUEST_LIST_CONTENT_MESSAGES.loadFailed,
    );

    await user.click(getPageButton(COMMON_MESSAGES.retry));

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchGuests).toHaveBeenCalledTimes(2);
  });
});

describe("GuestListPage 검색", () => {
  it.each([
    [
      "검색 버튼을 누르면",
      (user: UserEvent) =>
        user.click(getPageButton(COMMON_MESSAGES.search)),
    ],
    [
      "검색창에서 Enter를 누르면",
      (user: UserEvent) => user.keyboard("{Enter}"),
    ],
  ])("%s 앞뒤 공백을 지운 검색어로 1페이지를 조회한다", async (_, submit) => {
    const user = userEvent.setup();
    fetchGuests.mockResolvedValue(createGuestPage({ totalPages: 3 }));
    const router = renderGuestListPage(guestsPath({ page: "2" }));

    await user.type(await findKeywordInput(), `  ${KEYWORD}  `);
    await submit(user);

    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({ keyword: KEYWORD });
    });
    expect(fetchGuests).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 0 });
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
  });

  it("입력하는 동안에는 검색하지 않는다", async () => {
    const user = userEvent.setup();
    const router = renderGuestListPage();

    await screen.findByRole("table");
    await user.type(await findKeywordInput(), KEYWORD);

    expect(fetchGuests).toHaveBeenCalledOnce();
    expect(router.state.location.search).toEqual({});
  });
});

describe("GuestListPage 페이지 이동", () => {
  it("다음·이전 버튼을 누르면 검색어를 유지한 채 그 페이지로 URL을 바꿔 조회한다", async () => {
    const user = userEvent.setup();
    fetchGuests.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve(createGuestPage({ page, totalPages: 3 })),
    );
    const router = renderGuestListPage(guestsPath({ keyword: KEYWORD }));

    await screen.findByRole("table");
    const previousButton = getPageButton(
      COMMON_MESSAGES.previousPage,
    );
    expect(previousButton).toBeDisabled();
    await user.click(getPageButton(COMMON_MESSAGES.nextPage));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        guestsPath({ keyword: KEYWORD, page: "2" }),
      );
    });
    expect(fetchGuests).toHaveBeenLastCalledWith({ keyword: KEYWORD, page: 1 });

    await user.click(previousButton);

    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({ keyword: KEYWORD });
    });
  });

  it("마지막 페이지에서는 다음 버튼을 누를 수 없다", async () => {
    fetchGuests.mockResolvedValue(createGuestPage({ page: 2, totalPages: 3 }));
    renderGuestListPage(guestsPath({ page: "3" }));

    await screen.findByRole("table");
    expect(getPageButton(COMMON_MESSAGES.nextPage)).toBeDisabled();
  });

  it("URL의 페이지가 마지막 페이지보다 크면 마지막 페이지로 방문 기록을 바꿔 이동한다", async () => {
    fetchGuests.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve(
        createGuestPage({
          items: page > 1 ? [] : GUESTS,
          page,
          totalPages: 2,
        }),
      ),
    );
    const router = renderGuestListPage(guestsPath({ page: "50" }));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(guestsPath({ page: "2" }));
    });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(router.history.length).toBe(1);
  });
});

describe("GuestListPage URL 정리", () => {
  it.each([
    ["page가 숫자가 아니면", { page: "abc" }],
    ["page가 100보다 크면", { page: "101" }],
    ["page가 1이면", { page: "1" }],
    ["검색어가 공백만 있으면", { keyword: "   " }],
    ["검색어가 100자를 넘으면", { keyword: "가".repeat(101) }],
  ])("%s 기본값으로 조회하고 URL에서 지운다", async (_, search) => {
    const router = renderGuestListPage(guestsPath(search));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(guestsPath());
    expect(fetchGuests).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });
});
