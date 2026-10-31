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
import {
  parseRoomTypePathParams,
  ROOM_TYPE_FIELD_LABELS,
  ROOM_TYPE_INFO_MESSAGES,
  stringifyRoomTypePathParams,
} from "@/entities/room-type";
import {
  API_ERROR_CODES,
  roomListQueryKey,
  roomQueryKey,
  roomStatusHistoriesQueryKey,
  updateRoomType,
} from "@/shared/api";
import type { RoomType } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomTypeEditPage } from "./room-type-edit-page";

const { fetchRoomType } = vi.hoisted(() => ({ fetchRoomType: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    updateRoomType: vi.fn(),
    fetchRoomType: (roomTypeId: number) => fetchRoomType(roomTypeId),
  };
});

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const DETAIL_PAGE_TEXT = "객실 유형 상세 화면";

const ROOM_TYPE: RoomType = {
  id: 4,
  name: "스탠다드",
  capacity: 2,
  roomRate: 100000,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  version: 1,
};

function createApiError(status: number, code: string, message: string) {
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

function renderRoomTypeEditPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const roomTypeRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "room-types/$roomTypeId",
    params: {
      parse: parseRoomTypePathParams,
      stringify: stringifyRoomTypePathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        roomTypeRoute.addChildren([
          createRoute({
            getParentRoute: () => roomTypeRoute,
            path: "/",
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => roomTypeRoute,
            path: "edit",
            component: RoomTypeEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/room-types/${ROOM_TYPE.id}/edit`],
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { queryClient, user: userEvent.setup() };
}

async function renderLoadedRoomTypeEditPage() {
  const rendered = renderRoomTypeEditPage();
  await screen.findByRole("group", { name: ROOM_TYPE_INFO_MESSAGES.legend });
  return rendered;
}

function getNameField() {
  return within(
    screen.getByRole("group", { name: ROOM_TYPE_INFO_MESSAGES.legend }),
  ).getByLabelText(ROOM_TYPE_FIELD_LABELS.name);
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.save });
}

beforeEach(() => {
  fetchRoomType.mockResolvedValue(ROOM_TYPE);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomTypeEditPage", () => {
  it("저장에 성공하면 객실 목록과 객실 상세 캐시도 무효화하고 상태 이력은 두고 상세로 이동한다", async () => {
    vi.mocked(updateRoomType).mockResolvedValue({
      data: { ...ROOM_TYPE, version: 2 },
      message: "객실 유형을 수정했습니다.",
    });
    const { queryClient, user } = await renderLoadedRoomTypeEditPage();
    const roomListKey = roomListQueryKey({ page: 0 });
    const roomKey = roomQueryKey(7);
    const historyKey = roomStatusHistoriesQueryKey(7, { page: 0 });
    queryClient.setQueryData(roomListKey, {});
    queryClient.setQueryData(roomKey, {});
    queryClient.setQueryData(historyKey, {});

    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    const isInvalidated = (queryKey: readonly unknown[]) =>
      queryClient.getQueryState(queryKey)?.isInvalidated;
    expect(isInvalidated(roomListKey)).toBe(true);
    expect(isInvalidated(roomKey)).toBe(true);
    expect(isInvalidated(historyKey)).toBe(false);
  });

  it("같은 이름의 유형이 있다는 응답이면 서버 문구를 이름 칸 오류로 보여준다", async () => {
    const message = "같은 이름의 객실 유형이 이미 있습니다.";
    vi.mocked(updateRoomType).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.roomTypeDuplicated, message),
    );
    const { user } = await renderLoadedRoomTypeEditPage();

    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(getNameField()).toHaveAttribute("aria-invalid", "true");
    });
    expect(getNameField()).toHaveAccessibleDescription(message);
  });

  it("다른 사용자가 먼저 수정했다는 응답이면 서버 문구와 최신 내용 불러오기 버튼을 폼 안에 보여준다", async () => {
    const message = "다른 사용자가 먼저 수정했습니다.";
    vi.mocked(updateRoomType).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.roomTypeModified, message),
    );
    const { user } = await renderLoadedRoomTypeEditPage();

    await user.click(getSubmitButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(message);
    expect(
      screen.getByRole("button", { name: COMMON_MESSAGES.reload }),
    ).toBeInTheDocument();
  });
});
