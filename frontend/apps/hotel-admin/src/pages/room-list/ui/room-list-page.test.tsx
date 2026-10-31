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
import {
  ROOM_FIELD_LABELS,
  ROOM_INFORMATION_MESSAGES,
  ROOM_STATUS_LABELS,
} from "@/entities/room";
import { ROOM_SEARCH_FORM_MESSAGES } from "@/features/room-search";
import type { Room, RoomPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import {
  ROOM_LIST_CONTENT_MESSAGES,
  ROOM_TABLE_MESSAGES,
} from "@/widgets/room-list";
import { ROOM_LIST_MESSAGES } from "../config/messages";
import {
  ROOM_LIST_DEFAULT_SEARCH,
  roomListSearchSchema,
} from "../model/room-list-search";
import { RoomListPage } from "./room-list-page";

const { fetchRooms } = vi.hoisted(() => ({ fetchRooms: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchRooms: (params: Parameters<typeof actual.fetchRooms>[0]) =>
      fetchRooms(params),
  };
});

const ROOMS: Room[] = [
  {
    id: 2,
    name: "101",
    type: "스탠다드",
    capacity: 2,
    floor: 1,
    description: null,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    status: "VACANT",
    currentStay: {
      id: 5,
      checkInDate: "2026-10-30",
      checkOutDate: "2026-11-01",
      guest: { id: 9, name: "김이용", phone: "010-1234-5678" },
    },
    version: 0,
  },
  {
    id: 1,
    name: "스위트 A",
    type: "스위트",
    capacity: 4,
    floor: null,
    description: "바다가 보이는 객실입니다.",
    checkInTime: "16:00",
    checkOutTime: "12:00",
    status: "MAINTENANCE",
    currentStay: null,
    version: 3,
  },
];

const KEYWORD = "10";

function createRoomPage(overrides: Partial<RoomPage> = {}): RoomPage {
  return {
    items: ROOMS,
    page: 0,
    size: 10,
    totalElements: ROOMS.length,
    totalPages: 1,
    ...overrides,
  };
}

const EMPTY_ROOM_PAGE = createRoomPage({
  items: [],
  totalElements: 0,
  totalPages: 0,
});

function roomsPath(search: Record<string, string> = {}) {
  const searchString = new URLSearchParams(search).toString();
  return searchString ? `/rooms?${searchString}` : "/rooms";
}

function renderRoomListPage(initialPath = roomsPath()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const roomListRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "rooms/",
    validateSearch: roomListSearchSchema,
    search: { middlewares: [stripSearchParams(ROOM_LIST_DEFAULT_SEARCH)] },
    component: RoomListPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        roomListRoute,
        createRoute({ getParentRoute: () => layoutRoute, path: "rooms/new" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "rooms/$roomId",
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "stays/$stayId",
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

function findKeywordInput() {
  return screen.findByLabelText(ROOM_SEARCH_FORM_MESSAGES.keywordLabel);
}

function getStatusSelect() {
  return screen.getByRole("combobox", {
    name: ROOM_FIELD_LABELS.status,
  });
}

function getSearchButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.search });
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchRooms.mockResolvedValue(createRoomPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomListPage 목록", () => {
  it("객실 목록을 이름·유형·층·최대 인원·상태·지금 이용객 열의 표로 보여주고 층이 없으면 층 없음, 지금 이용이 없으면 빈칸을 보여준다", async () => {
    renderRoomListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      ROOM_FIELD_LABELS.name,
      ROOM_FIELD_LABELS.type,
      ROOM_FIELD_LABELS.floor,
      ROOM_FIELD_LABELS.capacity,
      ROOM_FIELD_LABELS.status,
      ROOM_TABLE_MESSAGES.currentGuest,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual([
      ["101", "스탠다드", "1", "2", ROOM_STATUS_LABELS.VACANT, "김이용"],
      [
        "스위트 A",
        "스위트",
        ROOM_INFORMATION_MESSAGES.emptyFloor,
        "4",
        ROOM_STATUS_LABELS.MAINTENANCE,
        "",
      ],
    ]);
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("지금 이용객 이름은 그 이용의 상세 화면으로 가는 링크다", async () => {
    renderRoomListPage();

    expect(
      await screen.findByRole("link", { name: "김이용" }),
    ).toHaveAttribute("href", "/stays/5");
  });

  it("객실 이름은 그 객실의 상세 화면으로 가는 링크다", async () => {
    const { router, user } = renderRoomListPage();

    const nameLink = await screen.findByRole("link", { name: ROOMS[0].name });
    expect(nameLink).toHaveAttribute("href", `/rooms/${ROOMS[0].id}`);

    await user.click(nameLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(`/rooms/${ROOMS[0].id}`);
    });
  });

  it("객실 등록 버튼을 누르면 객실 등록 화면으로 이동한다", async () => {
    const { router, user } = renderRoomListPage();

    const createLink = await screen.findByRole("link", {
      name: ROOM_LIST_MESSAGES.create,
    });
    expect(createLink).toHaveAttribute("href", "/rooms/new");

    await user.click(createLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/rooms/new");
    });
  });

  it("처음 불러오는 동안 불러오는 중 문구를 보여준다", async () => {
    fetchRooms.mockReturnValue(new Promise<never>(() => {}));
    renderRoomListPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
  });

  it("URL의 검색어·상태·페이지로 처음 조회하고 검색창과 상태 선택에 보여준다", async () => {
    fetchRooms.mockResolvedValue(createRoomPage({ page: 2, totalPages: 5 }));
    renderRoomListPage(
      roomsPath({ keyword: KEYWORD, status: "RESERVED", page: "3" }),
    );

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(3, 5)),
    ).toBeInTheDocument();
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
    expect(getStatusSelect()).toHaveValue("RESERVED");
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({
      keyword: KEYWORD,
      status: "RESERVED",
      page: 2,
    });
  });

  it("목록을 불러오지 못하면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    fetchRooms
      .mockRejectedValueOnce(new Error("서버 오류"))
      .mockResolvedValueOnce(createRoomPage());
    const { user } = renderRoomListPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ROOM_LIST_CONTENT_MESSAGES.loadFailed,
    );
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchRooms).toHaveBeenCalledTimes(2);
  });
});

describe("RoomListPage 검색과 상태 거르기", () => {
  it("상태 선택지는 전체와 네 상태다", async () => {
    renderRoomListPage();

    await findKeywordInput();
    expect(
      within(getStatusSelect())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      COMMON_MESSAGES.all,
      ROOM_STATUS_LABELS.VACANT,
      ROOM_STATUS_LABELS.RESERVED,
      ROOM_STATUS_LABELS.OCCUPIED,
      ROOM_STATUS_LABELS.MAINTENANCE,
    ]);
  });

  it("검색어와 상태를 고른 뒤 검색하면 앞뒤 공백을 지운 검색어와 상태로 1페이지를 조회한다", async () => {
    fetchRooms.mockResolvedValue(createRoomPage({ totalPages: 3 }));
    const { router, user } = renderRoomListPage(roomsPath({ page: "2" }));

    await user.type(await findKeywordInput(), `  ${KEYWORD}  `);
    await user.selectOptions(getStatusSelect(), ROOM_STATUS_LABELS.OCCUPIED);
    await user.click(getSearchButton());

    await vi.waitFor(() => {
      expect(router.state.location.search).toEqual({
        keyword: KEYWORD,
        status: "OCCUPIED",
      });
    });
    expect(fetchRooms).toHaveBeenLastCalledWith({
      keyword: KEYWORD,
      status: "OCCUPIED",
      page: 0,
    });
    expect(await findKeywordInput()).toHaveValue(KEYWORD);
  });

  it("상태를 고르기만 하면 조회하지 않고 검색할 때 반영한다", async () => {
    const { router, user } = renderRoomListPage();

    await screen.findByRole("table");
    await user.selectOptions(getStatusSelect(), ROOM_STATUS_LABELS.VACANT);

    expect(fetchRooms).toHaveBeenCalledOnce();
    expect(router.state.location.search).toEqual({});
  });

  it("상태를 전체로 바꿔 검색하면 상태 없이 조회하고 URL에서 지운다", async () => {
    const { router, user } = renderRoomListPage(
      roomsPath({ status: "VACANT" }),
    );

    await screen.findByRole("table");
    await user.selectOptions(
      getStatusSelect(),
      COMMON_MESSAGES.all,
    );
    await user.click(getSearchButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(roomsPath());
    });
    expect(fetchRooms).toHaveBeenLastCalledWith({ page: 0 });
  });

  it("다음 버튼을 누르면 검색어와 상태를 유지한 채 다음 페이지를 조회한다", async () => {
    fetchRooms.mockResolvedValue(createRoomPage({ totalPages: 3 }));
    const { router, user } = renderRoomListPage(
      roomsPath({ keyword: KEYWORD, status: "VACANT" }),
    );

    await screen.findByRole("table");
    await user.click(
      screen.getByRole("button", {
        name: COMMON_MESSAGES.nextPage,
      }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        roomsPath({ keyword: KEYWORD, status: "VACANT", page: "2" }),
      );
    });
    expect(fetchRooms).toHaveBeenLastCalledWith({
      keyword: KEYWORD,
      status: "VACANT",
      page: 1,
    });
  });
});

describe("RoomListPage 빈 상태", () => {
  it.each([
    ["검색어와 상태가 없으면 등록된 객실이 없다는", {}, ROOM_LIST_CONTENT_MESSAGES.empty],
    [
      "상태로만 걸러도 검색 결과가 없다는",
      { status: "OCCUPIED" },
      COMMON_MESSAGES.emptySearchResult,
    ],
    [
      "검색어가 있으면 검색 결과가 없다는",
      { keyword: KEYWORD },
      COMMON_MESSAGES.emptySearchResult,
    ],
  ])("항목이 없을 때 %s 문구를 보여준다", async (_, search, message) => {
    fetchRooms.mockResolvedValue(EMPTY_ROOM_PAGE);
    renderRoomListPage(roomsPath(search));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("RoomListPage URL 정리", () => {
  it.each([
    ["소문자면", "vacant"],
    ["정해진 값이 아니면", "CLEANING"],
    ["비어 있으면", ""],
  ])("상태가 %s 상태 없이 조회하고 URL에서 지운다", async (_, status) => {
    const { router } = renderRoomListPage(roomsPath({ status }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(roomsPath());
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({ page: 0 });
    expect(getStatusSelect()).toHaveValue("");
  });

  it("페이지가 범위를 넘으면 1페이지로 조회하고 URL에서 지운다", async () => {
    const { router } = renderRoomListPage(roomsPath({ page: "101" }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(roomsPath());
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("마지막 페이지를 넘은 페이지면 검색어와 상태를 유지한 채 마지막 페이지로 방문 기록을 바꿔 이동한다", async () => {
    fetchRooms
      .mockResolvedValueOnce(createRoomPage({ items: [], page: 49, totalPages: 2 }))
      .mockResolvedValueOnce(createRoomPage({ page: 1, totalPages: 2 }));
    const { router } = renderRoomListPage(
      roomsPath({ keyword: KEYWORD, status: "VACANT", page: "50" }),
    );

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(2, 2)),
    ).toBeInTheDocument();
    expect(router.state.location.href).toBe(
      roomsPath({ keyword: KEYWORD, status: "VACANT", page: "2" }),
    );
    expect(router.history.length).toBe(1);
  });
});
