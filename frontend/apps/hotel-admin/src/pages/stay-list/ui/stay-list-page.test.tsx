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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAY_CANCELED_LABELS, STAY_FIELD_LABELS } from "@/entities/stay";
import { STAY_SEARCH_FORM_MESSAGES } from "@/features/stay-search";
import type { Guest, Room, Stay, StayPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { STAY_LIST_CONTENT_MESSAGES } from "@/widgets/stay-list";
import {
  STAY_LIST_DEFAULT_SEARCH,
  stayListSearchSchema,
} from "../model/stay-list-search";
import { StayListPage } from "./stay-list-page";

const { fetchStays, fetchRooms, fetchGuest } = vi.hoisted(() => ({
  fetchStays: vi.fn(),
  fetchRooms: vi.fn(),
  fetchGuest: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchStays: (params: Parameters<typeof actual.fetchStays>[0]) =>
      fetchStays(params),
    fetchRooms: (params: Parameters<typeof actual.fetchRooms>[0]) =>
      fetchRooms(params),
    fetchGuest: (guestId: number) => fetchGuest(guestId),
  };
});

const ROOMS: Room[] = [
  {
    id: 2,
    name: "101",
    roomType: {
      id: 1,
      name: "스탠다드",
      capacity: 2,
      roomRate: 100000,
      checkInTime: "15:00",
      checkOutTime: "11:00",
    },
    floor: 1,
    description: null,
    status: "VACANT",
    currentStay: null,
    version: 0,
  },
  {
    id: 1,
    name: "스위트 A",
    roomType: {
      id: 2,
      name: "스위트",
      capacity: 4,
      roomRate: 100000,
      checkInTime: "16:00",
      checkOutTime: "12:00",
    },
    floor: null,
    description: null,
    status: "RESERVED",
    currentStay: null,
    version: 0,
  },
];

const GUEST: Guest = {
  id: 3,
  name: "김이용",
  phone: "010-1234-5678",
  email: "kim@example.com",
  version: 0,
};

const STAYS: Stay[] = [
  {
    id: 11,
    room: { id: 1, name: "스위트 A" },
    guest: { id: 3, name: "김이용", phone: "010-1234-5678" },
    checkInDate: "2026-11-20",
    checkOutDate: "2026-11-22",
    guestCount: 3,
    roomRate: 120000,
    nights: 2,
    baseAmount: 240000,
    discountAmount: 0,
    totalAmount: 240000,
    cancellation: null,
  },
  {
    id: 10,
    room: { id: 2, name: "101" },
    guest: { id: 4, name: "박손님", phone: "010-9876-5432" },
    checkInDate: "2026-11-02",
    checkOutDate: "2026-11-04",
    guestCount: 2,
    roomRate: 80000,
    nights: 2,
    baseAmount: 160000,
    discountAmount: 0,
    totalAmount: 160000,
    cancellation: {
      canceledAt: "2026-10-30T06:59:32.123456Z",
      canceledBy: { id: 1, name: "홍길동" },
      reason: null,
    },
  },
];

function createStayPage(overrides: Partial<StayPage> = {}): StayPage {
  return {
    items: STAYS,
    page: 0,
    size: 10,
    totalElements: STAYS.length,
    totalPages: 1,
    ...overrides,
  };
}

function staysPath(search: Record<string, string> = {}) {
  const searchString = new URLSearchParams(search).toString();
  return searchString ? `/stays?${searchString}` : "/stays";
}

function renderStayListPage(initialPath = staysPath()) {
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
          path: "stays/",
          validateSearch: stayListSearchSchema,
          search: {
            middlewares: [stripSearchParams(STAY_LIST_DEFAULT_SEARCH)],
          },
          component: StayListPage,
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
  return { router, user: userEvent.setup() };
}

function getRoomSelect() {
  return screen.getByRole("combobox", { name: STAY_FIELD_LABELS.room });
}

function getCanceledSelect() {
  return screen.getByRole("combobox", { name: STAY_FIELD_LABELS.canceled });
}

function getOptionTexts(select: HTMLElement) {
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent);
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchStays.mockResolvedValue(createStayPage());
  fetchRooms.mockResolvedValue({
    items: ROOMS,
    page: 0,
    size: 100,
    totalElements: ROOMS.length,
    totalPages: 1,
  });
  fetchGuest.mockResolvedValue(GUEST);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("StayListPage 목록", () => {
  it("이용 목록을 객실·이용객·체크인·체크아웃·인원·취소 여부·상세 열의 표로 보여주고 취소한 이용은 취소됨으로 표시한다", async () => {
    renderStayListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      STAY_FIELD_LABELS.room,
      STAY_FIELD_LABELS.guest,
      STAY_FIELD_LABELS.checkInDate,
      STAY_FIELD_LABELS.checkOutDate,
      STAY_FIELD_LABELS.guestCount,
      STAY_FIELD_LABELS.canceled,
      STAY_LIST_CONTENT_MESSAGES.detailHeader,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual([
      [
        "스위트 A",
        "김이용010-1234-5678",
        "2026-11-20",
        "2026-11-22",
        "3",
        "",
        STAY_LIST_CONTENT_MESSAGES.detailLink,
      ],
      [
        "101",
        "박손님010-9876-5432",
        "2026-11-02",
        "2026-11-04",
        "2",
        STAY_CANCELED_LABELS.true,
        STAY_LIST_CONTENT_MESSAGES.detailLink,
      ],
    ]);
    expect(
      within(rows[0]).getByRole("link", {
        name: STAY_LIST_CONTENT_MESSAGES.detailLink,
      }),
    ).toHaveAttribute("href", `/stays/${STAYS[0].id}`);
    expect(fetchStays).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("거르기 선택지는 객실이 전체와 이름순 객실 100개까지, 취소 여부가 전체·취소 안 됨·취소됨이다", async () => {
    renderStayListPage();

    await screen.findByRole("option", { name: ROOMS[1].name });
    expect(getOptionTexts(getRoomSelect())).toEqual([
      COMMON_MESSAGES.all,
      ROOMS[0].name,
      ROOMS[1].name,
    ]);
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({ page: 0, size: 100 });
    expect(getOptionTexts(getCanceledSelect())).toEqual([
      COMMON_MESSAGES.all,
      STAY_CANCELED_LABELS.false,
      STAY_CANCELED_LABELS.true,
    ]);
  });

  it("URL의 객실·이용객·취소 여부·페이지로 처음 조회하고 거르기 선택에 보여준다", async () => {
    fetchStays.mockResolvedValue(createStayPage({ page: 1, totalPages: 3 }));
    renderStayListPage(
      staysPath({ roomId: "2", guestId: "3", canceled: "true", page: "2" }),
    );

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(2, 3)),
    ).toBeInTheDocument();
    await screen.findByRole("option", { name: ROOMS[0].name });
    expect(getRoomSelect()).toHaveValue("2");
    expect(getCanceledSelect()).toHaveValue("true");
    expect(fetchStays).toHaveBeenCalledExactlyOnceWith({
      roomId: 2,
      guestId: 3,
      canceled: true,
      page: 1,
    });
  });
});

describe("StayListPage 거르기", () => {
  it("객실과 취소 여부를 고른 뒤 검색하면 이용객 거르기를 유지한 채 1페이지를 조회한다", async () => {
    fetchStays.mockResolvedValue(createStayPage({ totalPages: 3 }));
    const { router, user } = renderStayListPage(
      staysPath({ guestId: "3", page: "2" }),
    );

    await screen.findByRole("option", { name: ROOMS[1].name });
    await user.selectOptions(getRoomSelect(), ROOMS[1].name);
    await user.selectOptions(getCanceledSelect(), STAY_CANCELED_LABELS.false);
    expect(fetchStays).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: COMMON_MESSAGES.search }));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        staysPath({ roomId: "1", canceled: "false", guestId: "3" }),
      );
    });
    expect(fetchStays).toHaveBeenLastCalledWith({
      roomId: 1,
      guestId: 3,
      canceled: false,
      page: 0,
    });
  });

  it("이용객으로 걸렀으면 이용객 이름·전화번호와 다른 거르기는 두고 이용객 거르기만 푸는 링크를 보여준다", async () => {
    const { router, user } = renderStayListPage(
      staysPath({ roomId: "2", guestId: "3", canceled: "false" }),
    );

    expect(
      await screen.findByText(
        STAY_SEARCH_FORM_MESSAGES.guestFilterValue(GUEST.name, GUEST.phone),
      ),
    ).toBeInTheDocument();
    expect(fetchGuest).toHaveBeenCalledExactlyOnceWith(GUEST.id);
    const clearLink = screen.getByRole("link", {
      name: STAY_SEARCH_FORM_MESSAGES.clearGuestFilter,
    });
    expect(clearLink).toHaveAttribute(
      "href",
      staysPath({ roomId: "2", canceled: "false" }),
    );

    await user.click(clearLink);

    await vi.waitFor(() => {
      expect(fetchStays).toHaveBeenLastCalledWith({
        roomId: 2,
        canceled: false,
        page: 0,
      });
    });
    expect(router.state.location.href).toBe(
      staysPath({ roomId: "2", canceled: "false" }),
    );
    expect(
      screen.queryByRole("link", {
        name: STAY_SEARCH_FORM_MESSAGES.clearGuestFilter,
      }),
    ).not.toBeInTheDocument();
  });

  it("이용객으로 거르지 않았으면 이용객 거르기 표시가 없고 이용객을 조회하지 않는다", async () => {
    renderStayListPage();

    await screen.findByRole("table");
    expect(
      screen.queryByRole("link", {
        name: STAY_SEARCH_FORM_MESSAGES.clearGuestFilter,
      }),
    ).not.toBeInTheDocument();
    expect(fetchGuest).not.toHaveBeenCalled();
  });
});

describe("StayListPage 빈 상태와 URL 정리", () => {
  it.each([
    ["거르기가 없으면 등록된 이용이 없다는", {}, STAY_LIST_CONTENT_MESSAGES.empty],
    [
      "취소 여부로만 걸러도 검색 결과가 없다는",
      { canceled: "true" },
      COMMON_MESSAGES.emptySearchResult,
    ],
    [
      "이용객으로 걸렀으면 검색 결과가 없다는",
      { guestId: "3" },
      COMMON_MESSAGES.emptySearchResult,
    ],
  ])("항목이 없을 때 %s 문구를 보여준다", async (_, search, message) => {
    fetchStays.mockResolvedValue(
      createStayPage({ items: [], totalElements: 0, totalPages: 0 }),
    );
    renderStayListPage(staysPath(search));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it.each([
    ["취소 여부가 대문자면", { canceled: "TRUE" }],
    ["취소 여부가 비어 있으면", { canceled: "" }],
    ["객실 ID가 숫자가 아니면", { roomId: "abc" }],
    ["이용객 ID가 0이면", { guestId: "0" }],
  ])("%s 그 값 없이 조회하고 URL에서 지운다", async (_, search) => {
    const { router } = renderStayListPage(staysPath(search));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(staysPath());
    expect(fetchStays).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });
});
