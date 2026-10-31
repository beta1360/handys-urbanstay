import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import {
  parseRoomPathParams,
  ROOM_FIELD_LABELS,
  ROOM_INFO_FIELDS,
  ROOM_INFO_MESSAGES,
  ROOM_LOAD_MESSAGES,
  ROOM_NOT_FOUND_MESSAGES,
  stringifyRoomPathParams,
} from "@/entities/room";
import type { RoomInfoField } from "@/entities/room";
import { ROOM_UPDATE_FORM_MESSAGES } from "@/features/room-update";
import { API_ERROR_CODES, roomQueryKey, updateRoom } from "@/shared/api";
import type { Room } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomEditPage } from "./room-edit-page";

const { fetchRoom } = vi.hoisted(() => ({ fetchRoom: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    updateRoom: vi.fn(),
    fetchRoom: (roomId: number) => fetchRoom(roomId),
  };
});

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const UPDATE_MESSAGE = "객실 정보를 수정했습니다.";

const MODIFIED_MESSAGE =
  "다른 사용자가 먼저 수정했습니다. 다시 불러온 뒤 시도해 주세요.";

const DETAIL_PAGE_TEXT = "객실 상세 화면";

const ROOM: Room = {
  id: 1,
  name: "101",
  type: "스탠다드",
  capacity: 2,
  floor: null,
  description: "창가 객실입니다.",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  status: "OCCUPIED",
  version: 3,
};

const LATEST_ROOM: Room = {
  ...ROOM,
  name: "101-A",
  floor: 1,
  description: null,
  version: 4,
};

function valuesOf(room: Room): Record<RoomInfoField, string> {
  return {
    name: room.name,
    type: room.type,
    capacity: String(room.capacity),
    floor: room.floor === null ? "" : String(room.floor),
    checkInTime: room.checkInTime,
    checkOutTime: room.checkOutTime,
    description: room.description ?? "",
  };
}

function bodyOf(room: Room) {
  return {
    name: room.name,
    type: room.type,
    capacity: room.capacity,
    floor: room.floor,
    checkInTime: room.checkInTime,
    checkOutTime: room.checkOutTime,
    description: room.description,
    version: room.version,
  };
}

function createApiError(status: number, code: string, message = "서버 문구") {
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

function renderRoomEditPage(roomId = String(ROOM.id)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({ onError: vi.fn() }),
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
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => roomRoute,
            path: "edit",
            component: RoomEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/rooms/${roomId}`, `/rooms/${roomId}/edit`],
      initialIndex: 1,
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient, user: userEvent.setup() };
}

async function renderLoadedRoomEditPage() {
  const rendered = renderRoomEditPage();
  await screen.findByRole("group", { name: ROOM_INFO_MESSAGES.legend });
  return rendered;
}

function getFields(): Record<RoomInfoField, HTMLElement> {
  const group = within(
    screen.getByRole("group", { name: ROOM_INFO_MESSAGES.legend }),
  );
  const optional = (label: string) => `${label} ${ROOM_INFO_MESSAGES.optional}`;
  return {
    name: group.getByLabelText(ROOM_FIELD_LABELS.name),
    type: group.getByLabelText(ROOM_FIELD_LABELS.type),
    capacity: group.getByLabelText(ROOM_FIELD_LABELS.capacity),
    floor: group.getByLabelText(optional(ROOM_FIELD_LABELS.floor)),
    checkInTime: group.getByLabelText(ROOM_FIELD_LABELS.checkInTime),
    checkOutTime: group.getByLabelText(ROOM_FIELD_LABELS.checkOutTime),
    description: group.getByLabelText(optional(ROOM_FIELD_LABELS.description)),
  };
}

function expectFormValues(values: Record<RoomInfoField, string>) {
  const fields = getFields();
  for (const field of ROOM_INFO_FIELDS) {
    expect(fields[field]).toHaveValue(values[field]);
  }
}

function getSubmitButton() {
  return screen.getByRole("button", { name: ROOM_UPDATE_FORM_MESSAGES.submit });
}

function getReloadButton() {
  return screen.getByRole("button", { name: ROOM_UPDATE_FORM_MESSAGES.reload });
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    ROOM_NOT_FOUND_MESSAGES.description,
  );
  expect(
    screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
  ).toHaveAttribute("href", "/rooms");
  expect(screen.queryByRole("group")).not.toBeInTheDocument();
}

async function replaceName(user: UserEvent, value: string) {
  await user.clear(getFields().name);
  await user.paste(value);
}

beforeEach(() => {
  fetchRoom.mockResolvedValue(ROOM);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomEditPage 불러오기", () => {
  it("상세 조회 값으로 폼을 채우고 층이 없으면 빈 칸으로 둔다", async () => {
    await renderLoadedRoomEditPage();

    expectFormValues(valuesOf(ROOM));
    expect(fetchRoom).toHaveBeenCalledExactlyOnceWith(ROOM.id);
  });

  it("id가 잘못되면 조회하지 않고 찾을 수 없음을 보여준다", async () => {
    renderRoomEditPage("abc");

    await expectNotFound();
    expect(fetchRoom).not.toHaveBeenCalled();
  });
});

describe("RoomEditPage 저장", () => {
  it("바뀐 값이 없어도 처음 채운 값과 version으로 저장을 요청한다", async () => {
    vi.mocked(updateRoom).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedRoomEditPage();

    await user.click(getSubmitButton());

    expect(updateRoom).toHaveBeenCalledExactlyOnceWith(ROOM.id, bodyOf(ROOM));
  });

  it("저장에 성공하면 서버의 성공 문구를 토스트로 띄우고 상세 캐시를 바꾼 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(updateRoom).mockResolvedValue({
      data: LATEST_ROOM,
      message: UPDATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderLoadedRoomEditPage();

    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: UPDATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/rooms/${ROOM.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryData(roomQueryKey(ROOM.id))).toEqual(
      LATEST_ROOM,
    );
  });

  it("같은 이름의 객실이 있다는 응답이면 서버 문구를 이름 칸에 보여주고 초점을 옮긴다", async () => {
    vi.mocked(updateRoom).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.roomDuplicated, "이름 중복 문구"),
    );
    const { user } = await renderLoadedRoomEditPage();

    await replaceName(user, "102");
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(getFields().name).toHaveAccessibleDescription("이름 중복 문구");
    });
    expect(getFields().name).toHaveFocus();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("저장할 때 객실이 없다는 응답이면 입력한 내용을 그대로 두고 서버 문구를 오류 토스트로 보여준다", async () => {
    vi.mocked(updateRoom).mockRejectedValue(
      createApiError(404, API_ERROR_CODES.roomNotFound, "객실 없음 문구"),
    );
    const { user } = await renderLoadedRoomEditPage();

    await replaceName(user, "입력한 이름");
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: "객실 없음 문구",
      });
    });
    expectFormValues({ ...valuesOf(ROOM), name: "입력한 이름" });
  });
});

describe("RoomEditPage 수정 충돌", () => {
  async function submitWithConflict(user: UserEvent) {
    vi.mocked(updateRoom).mockRejectedValueOnce(
      createApiError(409, API_ERROR_CODES.roomModified, MODIFIED_MESSAGE),
    );
    await replaceName(user, "입력한 이름");
    await user.click(getSubmitButton());
    return screen.findByRole("alert");
  }

  it("다른 사용자가 먼저 수정했다는 응답이면 토스트 없이 서버 문구 알림 옆에 최신 내용 불러오기 버튼을 둔다", async () => {
    const { user } = await renderLoadedRoomEditPage();

    const alert = await submitWithConflict(user);

    expect(alert).toHaveTextContent(MODIFIED_MESSAGE);
    expect(getReloadButton().parentElement).toBe(alert.parentElement);
    expect(showToast).not.toHaveBeenCalled();
    expectFormValues({ ...valuesOf(ROOM), name: "입력한 이름" });
  });

  it("최신 내용 불러오기를 누르면 새로 조회해 최신 값으로 폼을 다시 채우고 첫 칸에 초점을 옮긴 뒤, 저장하면 새 version을 보낸다", async () => {
    const { user } = await renderLoadedRoomEditPage();
    await submitWithConflict(user);
    fetchRoom.mockResolvedValue(LATEST_ROOM);
    vi.mocked(updateRoom).mockReturnValue(new Promise<never>(() => {}));

    await user.click(getReloadButton());

    await vi.waitFor(() => {
      expectFormValues(valuesOf(LATEST_ROOM));
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getFields().name).toHaveFocus();
    });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateRoom).mock.lastCall).toEqual([
      ROOM.id,
      bodyOf(LATEST_ROOM),
    ]);
  });

  it("다시 불러오는 동안 최신 내용 불러오기 버튼은 로딩 상태이고 저장할 수 없다", async () => {
    const { user } = await renderLoadedRoomEditPage();
    await submitWithConflict(user);
    fetchRoom.mockReturnValue(new Promise<never>(() => {}));

    await user.click(getReloadButton());
    await user.click(getFields().name);
    await user.keyboard("{Enter}");

    expect(getReloadButton()).toHaveAttribute("aria-busy", "true");
    expect(getSubmitButton()).toBeDisabled();
    expect(updateRoom).toHaveBeenCalledOnce();
  });

  it("다시 불러오지 못하면 입력한 내용을 그대로 두고 불러오기 실패 문구를 보여주며 최신 내용 불러오기 버튼에 초점을 돌린다", async () => {
    const { user } = await renderLoadedRoomEditPage();
    await submitWithConflict(user);
    let failReload: (error: unknown) => void = () => {};
    fetchRoom.mockReturnValue(
      new Promise((_, reject) => {
        failReload = reject;
      }),
    );

    await user.click(getReloadButton());
    await act(async () => {
      failReload(createApiError(500, "INTERNAL_SERVER_ERROR"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ROOM_LOAD_MESSAGES.loadFailed,
    );
    expect(getReloadButton()).toHaveFocus();
    expectFormValues({ ...valuesOf(ROOM), name: "입력한 이름" });
  });

  it("다시 불러올 때 객실이 없다는 응답이면 찾을 수 없음을 보여준다", async () => {
    const { user } = await renderLoadedRoomEditPage();
    await submitWithConflict(user);
    fetchRoom.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.roomNotFound),
    );

    await user.click(getReloadButton());

    await expectNotFound();
  });
});
