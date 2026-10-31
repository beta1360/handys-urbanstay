import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseRoomPathParams,
  ROOM_FIELD_LABELS,
  ROOM_INFORMATION_MESSAGES,
  ROOM_LOAD_MESSAGES,
  ROOM_NOT_FOUND_MESSAGES,
  ROOM_STATUS_LABELS,
  stringifyRoomPathParams,
} from "@/entities/room";
import { API_ERROR_CODES } from "@/shared/api";
import type { Room } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomDetailPage } from "./room-detail-page";

const { fetchRoom } = vi.hoisted(() => ({ fetchRoom: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchRoom: (roomId: number) => fetchRoom(roomId),
  };
});

const ROOM: Room = {
  id: 1,
  name: "스위트 A",
  type: "스위트",
  capacity: 4,
  floor: -1,
  description: "바다가 보이는 객실입니다.\n조식을 제공합니다.",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  status: "RESERVED",
  version: 3,
};

function roomPath(roomId: number | string) {
  return `/rooms/${roomId}`;
}

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
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

function renderRoomDetailPage(initialEntries = [roomPath(ROOM.id)]) {
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
        ]),
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
        ROOM_FIELD_LABELS.type,
        ROOM_FIELD_LABELS.capacity,
        ROOM_FIELD_LABELS.floor,
        ROOM_FIELD_LABELS.description,
        ROOM_FIELD_LABELS.checkInTime,
        ROOM_FIELD_LABELS.checkOutTime,
        ROOM_FIELD_LABELS.status,
      ],
    );
    expect(getDescriptionTexts()).toEqual([
      ROOM.name,
      ROOM.type,
      "4",
      "-1",
      ROOM.description,
      ROOM.checkInTime,
      ROOM.checkOutTime,
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
    expect(descriptions[3]).toBe(ROOM_INFORMATION_MESSAGES.emptyFloor);
    expect(descriptions[4]).toBe(ROOM_INFORMATION_MESSAGES.emptyDescription);
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
