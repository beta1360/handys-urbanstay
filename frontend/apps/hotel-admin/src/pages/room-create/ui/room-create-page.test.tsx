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
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FORM_ALERT_MESSAGES,
  FORM_VALIDATION_MESSAGES,
} from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  ROOM_FIELD_LABELS,
  ROOM_INFO_FIELDS,
  ROOM_INFO_MESSAGES,
} from "@/entities/room";
import type { RoomInfoField } from "@/entities/room";
import { ROOM_TYPE_OPTION_MESSAGES } from "@/entities/room-type";
import {
  API_ERROR_CODES,
  createRoom,
  fetchRoomTypes,
  roomListQueryKey,
  roomQueryKey,
} from "@/shared/api";
import type { Room, RoomPage, RoomType } from "@/shared/api";
import { ACCESS_MESSAGES, COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomCreatePage } from "./room-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createRoom: vi.fn(),
  fetchRoomTypes: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const CREATE_MESSAGE = "객실을 생성했습니다.";

const DUPLICATED_MESSAGE = "같은 이름의 객실이 이미 있습니다.";

const DETAIL_PAGE_TEXT = "객실 상세 화면";

const ROOM: Room = {
  id: 7,
  name: "101",
  roomType: {
    id: 1,
    name: "스탠다드",
    capacity: 2,
    roomRate: 100000,
    checkInTime: "15:00",
    checkOutTime: "11:00",
  },
  floor: null,
  description: null,
  status: "VACANT",
  currentStay: null,
  version: 0,
};

const ROOM_TYPES: RoomType[] = [
  {
    id: 1,
    name: "스탠다드",
    capacity: 2,
    roomRate: 100000,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    version: 0,
  },
  {
    id: 2,
    name: "스위트",
    capacity: 4,
    roomRate: 250000,
    checkInTime: "16:00",
    checkOutTime: "12:00",
    version: 0,
  },
];

const EMPTY_ROOM_PAGE: RoomPage = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

const VALID_INPUT: Record<RoomInfoField, string> = {
  name: "101",
  roomTypeId: String(ROOM_TYPES[0].id),
  floor: "",
  description: "",
};

const REQUIRED_FIELDS: RoomInfoField[] = ["name", "roomTypeId"];

const FIELD_HINTS: Partial<Record<RoomInfoField, string>> = {
  floor: ROOM_INFO_MESSAGES.floorHint(-10, 200),
};

function describedText(field: RoomInfoField, error?: string) {
  return [FIELD_HINTS[field], error].filter(Boolean).join(" ");
}

function createAxiosError(status: number, code: string, message: string) {
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

function renderRoomCreatePage(isMaster = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({ onError: vi.fn() }),
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "rooms/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "rooms/new",
          beforeLoad: () => ({ isMaster }),
          component: RoomCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "rooms/$roomId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/rooms", "/rooms/new"],
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

async function renderLoadedRoomCreatePage() {
  const rendered = renderRoomCreatePage();
  await screen.findByRole("group", { name: ROOM_INFO_MESSAGES.legend });
  await screen.findByRole("option", { name: ROOM_TYPES[1].name });
  return rendered;
}

function getFields(): Record<RoomInfoField, HTMLElement> {
  const group = within(
    screen.getByRole("group", { name: ROOM_INFO_MESSAGES.legend }),
  );
  const optional = (label: string) => `${label} ${ROOM_INFO_MESSAGES.optional}`;
  return {
    name: group.getByLabelText(ROOM_FIELD_LABELS.name),
    roomTypeId: group.getByLabelText(ROOM_FIELD_LABELS.roomType),
    floor: group.getByLabelText(optional(ROOM_FIELD_LABELS.floor)),
    description: group.getByLabelText(optional(ROOM_FIELD_LABELS.description)),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.create });
}

function getInvalidFields() {
  return Object.values(getFields()).filter(
    (field) => field.getAttribute("aria-invalid") === "true",
  );
}

async function fillForm(
  user: UserEvent,
  input: Partial<Record<RoomInfoField, string>> = {},
) {
  const values = { ...VALID_INPUT, ...input };
  const fields = getFields();
  for (const field of ROOM_INFO_FIELDS) {
    if (values[field] === "") {
      continue;
    }
    if (field === "roomTypeId") {
      await user.selectOptions(fields[field], values[field]);
    } else {
      await user.click(fields[field]);
      await user.paste(values[field]);
    }
  }
}

async function submitValidForm(user: UserEvent) {
  await fillForm(user);
  await user.click(getSubmitButton());
}

beforeEach(() => {
  vi.mocked(fetchRoomTypes).mockResolvedValue(ROOM_TYPES);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomCreatePage 화면", () => {
  it("유형은 그 호텔의 유형을 서버 순서대로 고르는 선택 상자이고, 층과 소개만 (선택)이며 아래에 생성·취소 버튼을 둔다", async () => {
    await renderLoadedRoomCreatePage();

    const fields = getFields();
    expect(fields.roomTypeId.tagName).toBe("SELECT");
    expect(
      within(fields.roomTypeId)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      ROOM_TYPE_OPTION_MESSAGES.placeholder,
      ...ROOM_TYPES.map(({ name }) => name),
    ]);
    expect(fields.roomTypeId).toHaveValue("");
    expect(fields.floor).toHaveAttribute("inputmode", "numeric");
    expect(fields.floor).toHaveAccessibleDescription(describedText("floor"));
    expect(fields.description.tagName).toBe("TEXTAREA");
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", "/rooms");
  });

  it("유형 목록을 불러오지 못하면 유형 칸 아래에 안내를 보여준다", async () => {
    vi.mocked(fetchRoomTypes).mockRejectedValue(new Error("network"));
    renderRoomCreatePage();

    await vi.waitFor(() => {
      expect(getFields().roomTypeId).toHaveAccessibleDescription(
        ROOM_TYPE_OPTION_MESSAGES.loadFailed,
      );
    });
  });

  it("마스터가 아니면 폼 없이 권한이 없다는 문구만 보여주고 유형 목록을 요청하지 않는다", async () => {
    renderRoomCreatePage(false);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ACCESS_MESSAGES.forbidden,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(fetchRoomTypes).not.toHaveBeenCalled();
  });
});

describe("RoomCreatePage 입력 검사", () => {
  it("입력 없이 제출하면 층과 소개를 뺀 칸에 필수 오류를 보여주고 첫 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderLoadedRoomCreatePage();

    await user.click(getSubmitButton());

    const fields = getFields();
    expect(getInvalidFields()).toEqual(
      REQUIRED_FIELDS.map((field) => fields[field]),
    );
    for (const field of REQUIRED_FIELDS) {
      expect(fields[field]).toHaveAccessibleDescription(
        describedText(field, FORM_VALIDATION_MESSAGES.required),
      );
    }
    expect(fields.name).toHaveFocus();
    expect(createRoom).not.toHaveBeenCalled();
  });

  const { maxLength, min, max, typeMismatch } = FORM_VALIDATION_MESSAGES;

  it.each<[string, RoomInfoField, string, string]>([
    ["이름이 50자를 넘으면", "name", "가".repeat(51), maxLength(50)],
    ["층이 -10보다 작으면", "floor", "-11", min(-10)],
    ["층이 200보다 크면", "floor", "201", max(200)],
    ["층이 숫자가 아니면", "floor", "1층", typeMismatch],
    ["소개가 1000자를 넘으면", "description", "가".repeat(1001), maxLength(1000)],
  ])(
    "%s 그 칸에 서버와 같은 오류 하나만 보여주고 초점을 옮기며 요청하지 않는다",
    async (_, field, value, message) => {
      const { user } = await renderLoadedRoomCreatePage();

      await fillForm(user, { [field]: value });
      await user.click(getSubmitButton());

      const input = getFields()[field];
      expect(getInvalidFields()).toEqual([input]);
      expect(input).toHaveAccessibleDescription(describedText(field, message));
      expect(input).toHaveFocus();
      expect(createRoom).not.toHaveBeenCalled();
    },
  );
});

describe("RoomCreatePage 요청", () => {
  it("앞뒤 공백을 지운 값과 숫자로 바꾼 유형 id·층으로 요청한다", async () => {
    vi.mocked(createRoom).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedRoomCreatePage();

    await fillForm(user, {
      name: "  스위트 A  ",
      roomTypeId: String(ROOM_TYPES[1].id),
      floor: " -2 ",
      description: "  첫 줄\n둘째 줄  ",
    });
    await user.click(getSubmitButton());

    expect(createRoom).toHaveBeenCalledExactlyOnceWith(
      {
        name: "스위트 A",
        roomTypeId: ROOM_TYPES[1].id,
        floor: -2,
        description: "첫 줄\n둘째 줄",
      },
      expect.anything(),
    );
  });

  it("층과 소개가 비어 있으면 null로 보낸다", async () => {
    vi.mocked(createRoom).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedRoomCreatePage();

    await fillForm(user, { description: "   " });
    await user.click(getSubmitButton());

    expect(vi.mocked(createRoom).mock.lastCall?.[0]).toMatchObject({
      floor: null,
      description: null,
    });
  });

  it("생성 요청 중에는 생성 버튼이 로딩 상태이고 다시 제출해도 요청하지 않는다", async () => {
    vi.mocked(createRoom).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedRoomCreatePage();

    await submitValidForm(user);
    await user.click(getFields().name);
    await user.keyboard("{Enter}");

    expect(getSubmitButton()).toHaveAttribute("aria-busy", "true");
    expect(createRoom).toHaveBeenCalledOnce();
  });

  it("생성에 성공하면 서버의 성공 문구를 토스트로 띄우고 목록 캐시를 무효화하고 상세 캐시에 넣은 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createRoom).mockResolvedValue({
      data: ROOM,
      message: CREATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderLoadedRoomCreatePage();
    const listQueryKey = roomListQueryKey({ page: 0 });
    queryClient.setQueryData(listQueryKey, EMPTY_ROOM_PAGE);

    await submitValidForm(user);

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/rooms/${ROOM.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(roomQueryKey(ROOM.id))).toEqual(ROOM);
  });

  it("취소를 누르면 확인 없이 요청하지 않고 객실 목록으로 이동한다", async () => {
    const { user, router } = await renderLoadedRoomCreatePage();

    await fillForm(user);
    await user.click(screen.getByRole("link", { name: COMMON_MESSAGES.cancel }));

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/rooms");
    });
    expect(createRoom).not.toHaveBeenCalled();
  });
});

describe("RoomCreatePage 서버 오류 처리", () => {
  it("같은 이름의 객실이 있다는 응답이면 서버 문구를 이름 칸에 보여주고 초점을 옮기며 토스트를 띄우지 않는다", async () => {
    vi.mocked(createRoom).mockRejectedValue(
      createAxiosError(409, API_ERROR_CODES.roomDuplicated, DUPLICATED_MESSAGE),
    );
    const { user } = await renderLoadedRoomCreatePage();

    await submitValidForm(user);

    await vi.waitFor(() => {
      expect(getFields().name).toHaveAttribute("aria-invalid", "true");
    });
    expect(getFields().name).toHaveAccessibleDescription(DUPLICATED_MESSAGE);
    expect(getFields().name).toHaveFocus();
    expect(getInvalidFields()).toEqual([getFields().name]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it.each([
    [
      "서버 오류 응답이면 서버 문구를",
      createAxiosError(500, "INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다."),
      "서버 내부 오류가 발생했습니다.",
    ],
    [
      "네트워크 오류면 일반 오류 문구를",
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
      FORM_ALERT_MESSAGES.requestFailed,
    ],
  ])("%s 오류 토스트로 보여준다", async (_, error, message) => {
    vi.mocked(createRoom).mockRejectedValue(error);
    const { user } = await renderLoadedRoomCreatePage();

    await submitValidForm(user);

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message,
      });
    });
    expect(getSubmitButton()).not.toBeDisabled();
    expect(getInvalidFields()).toEqual([]);
  });
});
