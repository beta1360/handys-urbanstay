import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import {
  parseRoomPathParams,
  ROOM_FIELD_LABELS,
  ROOM_INFORMATION_MESSAGES,
  ROOM_LOAD_MESSAGES,
  ROOM_NOT_FOUND_MESSAGES,
  ROOM_STATUS_LABELS,
  stringifyRoomPathParams,
} from "@/entities/room";
import { ROOM_TYPE_FIELD_LABELS } from "@/entities/room-type";
import { STAY_FIELD_LABELS, STAY_LINK_MESSAGES } from "@/entities/stay";
import { ROOM_STATUS_CHANGE_MESSAGES } from "@/features/room-status-change";
import { API_ERROR_CODES, updateRoomStatus } from "@/shared/api";
import type {
  Room,
  RoomStatus,
  RoomStatusHistoryPage,
  RoomStatusHistoryParams,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import {
  ROOM_CURRENT_STAY_MESSAGES,
  ROOM_STATUS_HISTORY_MESSAGES,
} from "@/widgets/room-detail";
import { formatWon } from "@/shared/lib/money";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomDetailPage } from "./room-detail-page";

const { fetchRoom, fetchRoomStatusHistories } = vi.hoisted(() => ({
  fetchRoom: vi.fn(),
  fetchRoomStatusHistories: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    updateRoomStatus: vi.fn(),
    fetchRoom: (roomId: number) => fetchRoom(roomId),
    fetchRoomStatusHistories: (
      roomId: number,
      params: RoomStatusHistoryParams,
    ) => fetchRoomStatusHistories(roomId, params),
  };
});

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const ROOM: Room = {
  id: 1,
  name: "스위트 A",
  roomType: {
    id: 2,
    name: "스위트",
    capacity: 4,
    roomRate: 100000,
    checkInTime: "15:00",
    checkOutTime: "11:00",
  },
  floor: -1,
  description: "바다가 보이는 객실입니다.\n조식을 제공합니다.",
  status: "RESERVED",
  currentStay: null,
  version: 3,
};

const STATUS_HISTORY_PAGE: RoomStatusHistoryPage = {
  items: [
    {
      id: 2,
      fromStatus: "VACANT",
      toStatus: "RESERVED",
      changedBy: { id: 3, name: "김운영" },
      changedAt: "2026-10-30T15:05:00Z",
    },
    {
      id: 1,
      fromStatus: null,
      toStatus: "VACANT",
      changedBy: { id: 2, name: "홍길동" },
      changedAt: "2026-10-30T06:59:32.123456Z",
    },
  ],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
};

const EDIT_PAGE_TEXT = "객실 수정 화면";

const STATUS_MESSAGE = "객실 상태를 바꿨습니다.";

type StatusChangeResult = Awaited<ReturnType<typeof updateRoomStatus>>;

const STATUS_CONFLICT_MESSAGE = "다른 사용자가 먼저 상태를 바꿨습니다.";

function roomPath(roomId: number | string) {
  return `/rooms/${roomId}`;
}

function createApiError(
  status: number,
  code: string,
  message = "요청을 처리하지 못했습니다.",
) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderRoomDetailPage(
  initialEntries = [roomPath(ROOM.id)],
  isMaster = true,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const roomRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "rooms/$roomId",
    params: {
      parse: parseRoomPathParams,
      stringify: stringifyRoomPathParams,
    },
    beforeLoad: () => ({ isMaster }),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "rooms/" }),
        roomRoute.addChildren([
          createRoute({
            getParentRoute: () => roomRoute,
            path: "/",
            component: RoomDetailPage,
          }),
          createRoute({
            getParentRoute: () => roomRoute,
            path: "edit",
            component: () => <p>{EDIT_PAGE_TEXT}</p>,
          }),
        ]),
        createRoute({ getParentRoute: () => layoutRoute, path: "stays/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "stays/$stayId",
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/$guestId",
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries,
      initialIndex: initialEntries.length - 1,
    }),
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

function getDescriptionTexts() {
  return screen
    .getAllByRole("definition")
    .map((definition) => definition.textContent);
}

function getStatusButtons() {
  return within(
    screen.getByRole("group", { name: ROOM_STATUS_CHANGE_MESSAGES.title }),
  ).getAllByRole("button");
}

function getBackLink() {
  return screen.getByRole("link", { name: COMMON_MESSAGES.backToList });
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    ROOM_NOT_FOUND_MESSAGES.description,
  );
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAccessibleName(COMMON_MESSAGES.backToList);
  expect(screen.queryByRole("definition")).not.toBeInTheDocument();
}

beforeEach(() => {
  fetchRoom.mockResolvedValue(ROOM);
  fetchRoomStatusHistories.mockResolvedValue(STATUS_HISTORY_PAGE);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomDetailPage 정보", () => {
  it("객실의 모든 항목을 항목 이름과 값의 목록으로 보여주고 위쪽에 목록으로 링크를 둔다", async () => {
    renderRoomDetailPage();

    expect(await screen.findByText(ROOM.name)).toBeInTheDocument();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      [
        ROOM_FIELD_LABELS.name,
        ROOM_FIELD_LABELS.roomType,
        ROOM_TYPE_FIELD_LABELS.capacity,
        ROOM_TYPE_FIELD_LABELS.roomRate,
        ROOM_TYPE_FIELD_LABELS.checkInTime,
        ROOM_TYPE_FIELD_LABELS.checkOutTime,
        ROOM_FIELD_LABELS.floor,
        ROOM_FIELD_LABELS.description,
        ROOM_FIELD_LABELS.status,
      ],
    );
    expect(getDescriptionTexts()).toEqual([
      ROOM.name,
      ROOM.roomType.name,
      "4",
      formatWon(ROOM.roomType.roomRate),
      ROOM.roomType.checkInTime,
      ROOM.roomType.checkOutTime,
      "-1",
      ROOM.description,
      ROOM_STATUS_LABELS.RESERVED,
    ]);
    expect(getBackLink()).toHaveAttribute("href", "/rooms");
    expect(getBackLink()).not.toHaveAttribute("aria-current");
    expect(fetchRoom).toHaveBeenCalledExactlyOnceWith(ROOM.id);
  });

  it("층과 소개가 없으면 층 없음과 소개 없음을 보여준다", async () => {
    fetchRoom.mockResolvedValue({ ...ROOM, floor: null, description: null });
    renderRoomDetailPage();

    expect(await screen.findByText(ROOM.name)).toBeInTheDocument();
    const descriptions = getDescriptionTexts();
    expect(descriptions[6]).toBe(ROOM_INFORMATION_MESSAGES.emptyFloor);
    expect(descriptions[7]).toBe(ROOM_INFORMATION_MESSAGES.emptyDescription);
  });

  it("처음 불러오는 동안 불러오는 중 문구와 위쪽 목록으로 링크를 보여준다", async () => {
    fetchRoom.mockReturnValue(new Promise<never>(() => {}));
    renderRoomDetailPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(getBackLink()).toBeInTheDocument();
  });

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    fetchRoom
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(ROOM);
    const { user } = renderRoomDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ROOM_LOAD_MESSAGES.loadFailed,
    );
    expect(getBackLink()).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByText(ROOM.name)).toBeInTheDocument();
    expect(fetchRoom).toHaveBeenCalledTimes(2);
  });
});

describe("RoomDetailPage 지금 이용", () => {
  function findCurrentStayRegion() {
    return screen.findByRole("region", {
      name: ROOM_CURRENT_STAY_MESSAGES.title,
    });
  }

  it("지금 이용이 있으면 이용객(이용객 상세 링크)·전화번호·체크인·체크아웃 날짜와 이용 상세 링크를 보여준다", async () => {
    fetchRoom.mockResolvedValue({
      ...ROOM,
      currentStay: {
        id: 5,
        checkInDate: "2026-10-30",
        checkOutDate: "2026-11-01",
        guest: { id: 9, name: "김이용", phone: "010-1234-5678" },
      },
    });
    renderRoomDetailPage();

    const region = await findCurrentStayRegion();
    expect(
      within(region)
        .getAllByRole("term")
        .map((term) => term.textContent),
    ).toEqual([
      STAY_FIELD_LABELS.guest,
      STAY_FIELD_LABELS.guestPhone,
      STAY_FIELD_LABELS.checkInDate,
      STAY_FIELD_LABELS.checkOutDate,
    ]);
    expect(
      within(region)
        .getAllByRole("definition")
        .map((definition) => definition.textContent),
    ).toEqual(["김이용", "010-1234-5678", "2026-10-30", "2026-11-01"]);
    expect(
      within(region).getByRole("link", { name: "김이용" }),
    ).toHaveAttribute("href", "/guests/9");
    expect(
      within(region).getByRole("link", {
        name: ROOM_CURRENT_STAY_MESSAGES.stayDetail,
      }),
    ).toHaveAttribute("href", "/stays/5");
  });

  it("지금 이용이 없으면 이용 중인 이용객이 없다는 문구만 보여준다", async () => {
    renderRoomDetailPage();

    const region = await findCurrentStayRegion();
    expect(region).toHaveTextContent(ROOM_CURRENT_STAY_MESSAGES.empty);
    expect(within(region).queryByRole("link")).not.toBeInTheDocument();
    expect(within(region).queryByRole("term")).not.toBeInTheDocument();
  });
});

describe("RoomDetailPage 수정 버튼", () => {
  it("운영자에게는 수정 버튼을 숨기고 이용 보기 링크와 상태 바꾸기 버튼은 그대로 둔다", async () => {
    renderRoomDetailPage([roomPath(ROOM.id)], false);

    expect(
      await screen.findByRole("link", { name: STAY_LINK_MESSAGES.stays }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: COMMON_MESSAGES.edit }),
    ).not.toBeInTheDocument();
    expect(getStatusButtons().length).toBeGreaterThan(0);
    getStatusButtons().forEach((button) => expect(button).toBeEnabled());
  });

  it("객실 정보를 보여줄 때 목록으로 링크 줄의 오른쪽 끝에 이용 보기 링크와 수정 버튼을 두고, 수정을 누르면 수정 화면으로 이동한다", async () => {
    const { router, user } = renderRoomDetailPage();

    const editLink = await screen.findByRole("link", {
      name: COMMON_MESSAGES.edit,
    });
    expect(editLink).toHaveAttribute("href", `${roomPath(ROOM.id)}/edit`);
    const actionRow = getBackLink().parentElement;
    expect(actionRow?.lastElementChild?.lastElementChild).toBe(editLink);
    const staysLink = screen.getByRole("link", {
      name: STAY_LINK_MESSAGES.stays,
    });
    expect(staysLink).toHaveAttribute("href", `/stays?roomId=${ROOM.id}`);
    expect(staysLink.nextElementSibling).toBe(editLink);

    await user.click(editLink);

    expect(await screen.findByText(EDIT_PAGE_TEXT)).toBeInTheDocument();
    expect(router.state.location.href).toBe(`${roomPath(ROOM.id)}/edit`);
  });

  it.each([
    ["불러오는 중", "status", () => new Promise<never>(() => {})],
    [
      "불러오지 못했을 때",
      "alert",
      () => Promise.reject(createApiError(500, "INTERNAL_SERVER_ERROR")),
    ],
  ])("%s에는 수정 버튼을 보여주지 않는다", async (_, role, fetchResult) => {
    fetchRoom.mockImplementation(fetchResult);
    renderRoomDetailPage();

    expect(await screen.findByRole(role)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: COMMON_MESSAGES.edit }),
    ).not.toBeInTheDocument();
  });
});

describe("RoomDetailPage 찾을 수 없음", () => {
  it("객실이 없다는 404 응답이면 위쪽 목록으로 링크 없이 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchRoom.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.roomNotFound),
    );
    renderRoomDetailPage();

    await expectNotFound();
  });

  it.each(["abc", "0", "-1", "1.5", "1e3", "9007199254740992"])(
    "id가 %s면 조회하지 않고 찾을 수 없음을 보여준다",
    async (roomId) => {
      renderRoomDetailPage([roomPath(roomId)]);

      await expectNotFound();
      expect(fetchRoom).not.toHaveBeenCalled();
    },
  );

  it("목록으로 버튼을 누르면 검색·상태·페이지 없이 객실 목록으로 이동한다", async () => {
    const { router, user } = renderRoomDetailPage([
      "/rooms?keyword=10&status=VACANT&page=2",
      roomPath("abc"),
    ]);

    await user.click(
      await screen.findByRole("link", { name: COMMON_MESSAGES.backToList }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/rooms");
    });
  });
});

describe("RoomDetailPage 상태 바꾸기", () => {
  it.each<[RoomStatus, RoomStatus[]]>([
    ["VACANT", ["RESERVED", "MAINTENANCE"]],
    ["RESERVED", ["OCCUPIED", "VACANT"]],
    ["OCCUPIED", ["MAINTENANCE"]],
    ["MAINTENANCE", ["VACANT"]],
  ])(
    "지금 상태가 %s면 갈 수 있는 상태만 버튼으로 보여준다",
    async (status, nextStatuses) => {
      fetchRoom.mockResolvedValue({ ...ROOM, status });
      renderRoomDetailPage();

      expect(
        await screen.findByRole("group", {
          name: ROOM_STATUS_CHANGE_MESSAGES.title,
        }),
      ).toBeInTheDocument();
      expect(getStatusButtons().map((button) => button.textContent)).toEqual(
        nextStatuses.map((nextStatus) => ROOM_STATUS_LABELS[nextStatus]),
      );
    },
  );

  it("누르면 화면에서 본 상태와 바꿀 상태를 보내고 요청 중에는 버튼을 막는다. 성공하면 서버 문구를 토스트로 보여주고 객실을 다시 불러온다", async () => {
    const changedRoom: Room = { ...ROOM, status: "OCCUPIED" };
    let resolveChange: (result: StatusChangeResult) => void = () => {};
    vi.mocked(updateRoomStatus).mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      }),
    );
    fetchRoom.mockResolvedValueOnce(ROOM).mockResolvedValueOnce(changedRoom);
    const { user } = renderRoomDetailPage();

    await user.click(
      await screen.findByRole("button", { name: ROOM_STATUS_LABELS.OCCUPIED }),
    );

    expect(updateRoomStatus).toHaveBeenCalledExactlyOnceWith(ROOM.id, {
      from: "RESERVED",
      to: "OCCUPIED",
    });
    getStatusButtons().forEach((button) => expect(button).toBeDisabled());

    resolveChange({ data: changedRoom, message: STATUS_MESSAGE });

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "success",
        message: STATUS_MESSAGE,
      });
    });
    expect(fetchRoom).toHaveBeenCalledTimes(2);
    expect(fetchRoomStatusHistories).toHaveBeenCalledTimes(2);
    expect(getDescriptionTexts().at(-1)).toBe(ROOM_STATUS_LABELS.OCCUPIED);
    expect(getStatusButtons().map((button) => button.textContent)).toEqual([
      ROOM_STATUS_LABELS.MAINTENANCE,
    ]);
    expect(getStatusButtons()[0]).toBeEnabled();
  });

  it.each([
    API_ERROR_CODES.roomStatusChanged,
    API_ERROR_CODES.roomStatusTransitionNotAllowed,
  ])(
    "409 %s면 서버 문구를 오류 토스트로 보여주고 객실을 다시 불러온다",
    async (code) => {
      const latestRoom: Room = { ...ROOM, status: "OCCUPIED" };
      vi.mocked(updateRoomStatus).mockRejectedValue(
        createApiError(409, code, STATUS_CONFLICT_MESSAGE),
      );
      fetchRoom.mockResolvedValueOnce(ROOM).mockResolvedValueOnce(latestRoom);
      const { user } = renderRoomDetailPage();

      await user.click(
        await screen.findByRole("button", { name: ROOM_STATUS_LABELS.VACANT }),
      );

      await vi.waitFor(() => {
        expect(showToast).toHaveBeenCalledExactlyOnceWith({
          type: "error",
          message: STATUS_CONFLICT_MESSAGE,
        });
      });
      expect(fetchRoom).toHaveBeenCalledTimes(2);
      expect(fetchRoomStatusHistories).toHaveBeenCalledTimes(2);
      expect(getDescriptionTexts().at(-1)).toBe(ROOM_STATUS_LABELS.OCCUPIED);
      expect(getStatusButtons()[0]).toBeEnabled();
    },
  );
});

describe("RoomDetailPage 상태 이력", () => {
  function getHistoryRows() {
    return screen
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      );
  }

  it("바꾼 시각(한국 시간), 이전 상태 → 바뀐 상태, 바꾼 사람을 최신순으로 보여주고 등록 이력의 이전 상태는 없음으로 보여준다", async () => {
    renderRoomDetailPage();

    expect(
      await screen.findByRole("columnheader", {
        name: ROOM_STATUS_HISTORY_MESSAGES.changedAt,
      }),
    ).toBeInTheDocument();
    const { noFromStatus, statusArrow } = ROOM_STATUS_HISTORY_MESSAGES;
    expect(getHistoryRows()).toEqual([
      [
        "2026-10-31 00:05",
        `${ROOM_STATUS_LABELS.VACANT}${statusArrow}${ROOM_STATUS_LABELS.RESERVED}`,
        "김운영",
      ],
      [
        "2026-10-30 15:59",
        `${noFromStatus}${statusArrow}${ROOM_STATUS_LABELS.VACANT}`,
        "홍길동",
      ],
    ]);
    expect(fetchRoomStatusHistories).toHaveBeenCalledExactlyOnceWith(ROOM.id, {
      page: 0,
    });
  });

  it("다음 버튼을 누르면 다음 페이지의 이력을 불러온다", async () => {
    fetchRoomStatusHistories.mockResolvedValue({
      ...STATUS_HISTORY_PAGE,
      totalElements: 12,
      totalPages: 2,
    });
    const { user } = renderRoomDetailPage();

    await user.click(
      await screen.findByRole("button", { name: COMMON_MESSAGES.nextPage }),
    );

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(2, 2)),
    ).toBeInTheDocument();
    expect(fetchRoomStatusHistories).toHaveBeenLastCalledWith(ROOM.id, {
      page: 1,
    });
  });
});
