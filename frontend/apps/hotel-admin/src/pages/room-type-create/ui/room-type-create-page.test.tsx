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
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  ROOM_TYPE_FIELD_LABELS,
  ROOM_TYPE_INFO_FIELDS,
  ROOM_TYPE_INFO_MESSAGES,
} from "@/entities/room-type";
import type { RoomTypeInfoField } from "@/entities/room-type";
import {
  API_ERROR_CODES,
  createRoomType,
  roomTypeQueryKey,
} from "@/shared/api";
import type { RoomType } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomTypeCreatePage } from "./room-type-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createRoomType: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const CREATE_MESSAGE = "객실 유형을 생성했습니다.";

const DUPLICATED_MESSAGE = "같은 이름의 객실 유형이 이미 있습니다.";

const DETAIL_PAGE_TEXT = "객실 유형 상세 화면";

const ROOM_TYPE: RoomType = {
  id: 3,
  name: "디럭스",
  capacity: 3,
  roomRate: 150000,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  version: 0,
};

const VALID_INPUT: Record<RoomTypeInfoField, string> = {
  name: "디럭스",
  capacity: "3",
  roomRate: "150000",
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

const TIME_FIELDS: RoomTypeInfoField[] = ["checkInTime", "checkOutTime"];

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

async function renderRoomTypeCreatePage() {
  const queryClient = new QueryClient({
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
        createRoute({ getParentRoute: () => layoutRoute, path: "room-types/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "room-types/new",
          component: RoomTypeCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "room-types/$roomTypeId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/room-types", "/room-types/new"],
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
  await screen.findByRole("group", { name: ROOM_TYPE_INFO_MESSAGES.legend });
  return { router, queryClient, user: userEvent.setup() };
}

function getFields(): Record<RoomTypeInfoField, HTMLElement> {
  const group = within(
    screen.getByRole("group", { name: ROOM_TYPE_INFO_MESSAGES.legend }),
  );
  return {
    name: group.getByLabelText(ROOM_TYPE_FIELD_LABELS.name),
    capacity: group.getByLabelText(ROOM_TYPE_FIELD_LABELS.capacity),
    roomRate: group.getByLabelText(ROOM_TYPE_FIELD_LABELS.roomRate),
    checkInTime: group.getByLabelText(ROOM_TYPE_FIELD_LABELS.checkInTime),
    checkOutTime: group.getByLabelText(ROOM_TYPE_FIELD_LABELS.checkOutTime),
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
  input: Partial<Record<RoomTypeInfoField, string>> = {},
) {
  const values = { ...VALID_INPUT, ...input };
  const fields = getFields();
  for (const field of ROOM_TYPE_INFO_FIELDS) {
    if (TIME_FIELDS.includes(field)) {
      await user.type(fields[field], values[field]);
    } else {
      await user.click(fields[field]);
      await user.paste(values[field]);
    }
  }
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomTypeCreatePage", () => {
  it("1박 요금은 숫자 입력창, 시각은 시간 입력창이고 아래에 생성·취소 버튼을 둔다", async () => {
    await renderRoomTypeCreatePage();

    const fields = getFields();
    expect(fields.capacity).toHaveAttribute("inputmode", "numeric");
    expect(fields.roomRate).toHaveAttribute("inputmode", "numeric");
    expect(fields.checkInTime).toHaveAttribute("type", "time");
    expect(fields.checkOutTime).toHaveAttribute("type", "time");
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", "/room-types");
  });

  it("입력 없이 제출하면 모든 칸에 필수 오류를 보여주고 첫 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderRoomTypeCreatePage();

    await user.click(getSubmitButton());

    const fields = getFields();
    expect(getInvalidFields()).toEqual(Object.values(fields));
    expect(fields.name).toHaveAccessibleDescription(
      FORM_VALIDATION_MESSAGES.required,
    );
    expect(fields.name).toHaveFocus();
    expect(createRoomType).not.toHaveBeenCalled();
  });

  it.each([
    ["쉼표를 넣으면", "150,000", FORM_VALIDATION_MESSAGES.typeMismatch],
    ["10,000,000원보다 크면", "10000001", FORM_VALIDATION_MESSAGES.max(10000000)],
  ])(
    "1박 요금에 %s 그 칸에만 오류를 보여주고 요청하지 않는다",
    async (_, value, message) => {
      const { user } = await renderRoomTypeCreatePage();

      await fillForm(user, { roomRate: value });
      await user.click(getSubmitButton());

      expect(getInvalidFields()).toEqual([getFields().roomRate]);
      expect(getFields().roomRate).toHaveAccessibleDescription(
        expect.stringContaining(message),
      );
      expect(createRoomType).not.toHaveBeenCalled();
    },
  );

  it("숫자로 바꾼 값으로 생성하고, 성공하면 서버 문구를 토스트로 띄우고 상세 캐시에 넣은 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createRoomType).mockResolvedValue({
      data: ROOM_TYPE,
      message: CREATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderRoomTypeCreatePage();

    await fillForm(user, { name: "  디럭스  " });
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(vi.mocked(createRoomType).mock.calls[0][0]).toEqual({
      name: "디럭스",
      capacity: 3,
      roomRate: 150000,
      checkInTime: "15:00",
      checkOutTime: "11:00",
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/room-types/${ROOM_TYPE.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryData(roomTypeQueryKey(ROOM_TYPE.id))).toEqual(
      ROOM_TYPE,
    );
  });

  it("같은 이름의 유형이 있다는 응답이면 서버 문구를 이름 칸에 보여주고 초점을 옮기며 토스트를 띄우지 않는다", async () => {
    vi.mocked(createRoomType).mockRejectedValue(
      createAxiosError(
        409,
        API_ERROR_CODES.roomTypeDuplicated,
        DUPLICATED_MESSAGE,
      ),
    );
    const { user } = await renderRoomTypeCreatePage();

    await fillForm(user);
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(getFields().name).toHaveAttribute("aria-invalid", "true");
    });
    expect(getFields().name).toHaveAccessibleDescription(DUPLICATED_MESSAGE);
    expect(getFields().name).toHaveFocus();
    expect(getInvalidFields()).toEqual([getFields().name]);
    expect(showToast).not.toHaveBeenCalled();
  });
});
