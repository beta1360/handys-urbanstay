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
import {
  ROOM_TYPE_FIELD_LABELS,
  ROOM_TYPE_OPTION_MESSAGES,
} from "@/entities/room-type";
import { ROOM_SEARCH_FORM_MESSAGES } from "@/features/room-search";
import type { Room, RoomPage, RoomType } from "@/shared/api";
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

const { fetchRooms, fetchRoomTypes } = vi.hoisted(() => ({
  fetchRooms: vi.fn(),
  fetchRoomTypes: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchRooms: (params: Parameters<typeof actual.fetchRooms>[0]) =>
      fetchRooms(params),
    fetchRoomTypes: () => fetchRoomTypes(),
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
    roomType: {
      id: 2,
      name: "스위트",
      capacity: 4,
      roomRate: 100000,
      checkInTime: "16:00",
      checkOutTime: "12:00",
    },
    floor: null,
    description: "바다가 보이는 객실입니다.",
    status: "MAINTENANCE",
    currentStay: null,
    version: 3,
  },
];

const KEYWORD = "10";

const ROOM_TYPES: RoomType[] = [
  { ...ROOMS[1].roomType, version: 0 },
  { ...ROOMS[0].roomType, version: 0 },
];

const UNLISTED_ROOM_TYPE_ID = "99";

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

function renderRoomListPage(initialPath = roomsPath(), isMaster = true) {
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
    beforeLoad: () => ({ isMaster }),
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

function getRoomTypeSelect() {
  return screen.getByRole("combobox", { name: ROOM_FIELD_LABELS.roomType });
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
  fetchRoomTypes.mockResolvedValue(ROOM_TYPES);
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
      ROOM_FIELD_LABELS.roomType,
      ROOM_FIELD_LABELS.floor,
      ROOM_TYPE_FIELD_LABELS.capacity,
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

  it("지금 이용객 이름은 그 이용객의 상세 화면으로 가는 링크다", async () => {
    renderRoomListPage();

    expect(
      await screen.findByRole("link", { name: "김이용" }),
    ).toHaveAttribute("href", "/guests/9");
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

  it("운영자에게는 객실 생성 버튼 없이 객실 목록을 그대로 보여준다", async () => {
    renderRoomListPage(roomsPath(), false);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ROOMS[0].name }),
    ).toHaveAttribute("href", `/rooms/${ROOMS[0].id}`);
    expect(
      screen.queryByRole("link", { name: ROOM_LIST_MESSAGES.create }),
    ).not.toBeInTheDocument();
  });

  it("객실 생성 버튼을 누르면 객실 생성 화면으로 이동한다", async () => {
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

describe("RoomListPage 유형 거르기", () => {
  it("유형 선택지는 전체와 그 호텔의 유형(서버 순서)이다", async () => {
    renderRoomListPage();

    await screen.findByRole("option", { name: ROOM_TYPES[1].name });
    expect(
      within(getRoomTypeSelect())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([COMMON_MESSAGES.all, ROOM_TYPES[0].name, ROOM_TYPES[1].name]);
  });

  it("유형을 고른 뒤 검색하면 URL에 유형을 두고 그 유형으로 1페이지를 조회한다", async () => {
    fetchRooms.mockResolvedValue(createRoomPage({ totalPages: 3 }));
    const { router, user } = renderRoomListPage(roomsPath({ page: "2" }));

    await screen.findByRole("option", { name: ROOM_TYPES[0].name });
    await user.selectOptions(getRoomTypeSelect(), ROOM_TYPES[0].name);
    expect(fetchRooms).toHaveBeenCalledOnce();
    await user.click(getSearchButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        roomsPath({ roomTypeId: String(ROOM_TYPES[0].id) }),
      );
    });
    expect(fetchRooms).toHaveBeenLastCalledWith({
      roomTypeId: ROOM_TYPES[0].id,
      page: 0,
    });
  });

  it("URL의 유형으로 처음 조회하고 유형 선택에 보여준다", async () => {
    const { router } = renderRoomListPage(
      roomsPath({ roomTypeId: String(ROOM_TYPES[1].id) }),
    );

    await screen.findByRole("option", { name: ROOM_TYPES[1].name });
    expect(getRoomTypeSelect()).toHaveValue(String(ROOM_TYPES[1].id));
    expect(router.state.location.href).toBe(
      roomsPath({ roomTypeId: String(ROOM_TYPES[1].id) }),
    );
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({
      roomTypeId: ROOM_TYPES[1].id,
      page: 0,
    });
  });

  it.each([
    ["숫자가 아니면", "abc"],
    ["0이면", "0"],
  ])("유형 ID가 %s 유형 없이 조회하고 URL에서 지운다", async (_, roomTypeId) => {
    const { router } = renderRoomListPage(roomsPath({ roomTypeId }));

    await screen.findByRole("table");
    expect(router.state.location.href).toBe(roomsPath());
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("URL의 유형이 불러온 유형 목록에 없으면 방문 기록을 바꿔 URL에서 지우고 유형 없이 다시 조회한다", async () => {
    const { router } = renderRoomListPage(
      roomsPath({ status: "VACANT", roomTypeId: UNLISTED_ROOM_TYPE_ID }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(roomsPath({ status: "VACANT" }));
    });
    expect(router.history.length).toBe(1);
    expect(fetchRooms).toHaveBeenLastCalledWith({ status: "VACANT", page: 0 });
    expect(getRoomTypeSelect()).toHaveValue("");
  });

  it("유형 목록을 불러오지 못하면 URL의 유형을 두고 유형 칸 아래에 불러오기 실패 문구를 보여준다", async () => {
    fetchRoomTypes.mockRejectedValue(new Error("network"));
    const { router } = renderRoomListPage(
      roomsPath({ roomTypeId: UNLISTED_ROOM_TYPE_ID }),
    );

    expect(
      await screen.findByText(ROOM_TYPE_OPTION_MESSAGES.loadFailed),
    ).toBeInTheDocument();
    expect(getRoomTypeSelect()).toHaveAccessibleDescription(
      ROOM_TYPE_OPTION_MESSAGES.loadFailed,
    );
    expect(router.state.location.href).toBe(
      roomsPath({ roomTypeId: UNLISTED_ROOM_TYPE_ID }),
    );
    expect(fetchRooms).toHaveBeenCalledExactlyOnceWith({
      roomTypeId: Number(UNLISTED_ROOM_TYPE_ID),
      page: 0,
    });
  });

  it("유형 목록이 비면 선택지는 전체뿐이고 생성 안내 없이 URL의 유형을 지운 뒤 유형 없이 다시 조회한다", async () => {
    fetchRoomTypes.mockResolvedValue([]);
    const { router } = renderRoomListPage(
      roomsPath({ roomTypeId: UNLISTED_ROOM_TYPE_ID }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(roomsPath());
    });
    expect(
      within(getRoomTypeSelect())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([COMMON_MESSAGES.all]);
    expect(
      screen.queryByText(ROOM_TYPE_OPTION_MESSAGES.empty),
    ).not.toBeInTheDocument();
    expect(fetchRooms).toHaveBeenLastCalledWith({ page: 0 });
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
    [
      "유형으로만 걸러도 검색 결과가 없다는",
      { roomTypeId: "1" },
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
