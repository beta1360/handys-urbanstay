import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseRoomTypePathParams,
  ROOM_TYPE_FIELD_LABELS,
  stringifyRoomTypePathParams,
} from "@/entities/room-type";
import type { RoomType } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { formatWon } from "@/shared/lib/money";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { RoomTypeDetailPage } from "./room-type-detail-page";

const { fetchRoomType } = vi.hoisted(() => ({ fetchRoomType: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchRoomType: (roomTypeId: number) => fetchRoomType(roomTypeId),
  };
});

const ROOM_TYPE: RoomType = {
  id: 4,
  name: "스탠다드",
  capacity: 2,
  roomRate: 150000,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  version: 1,
};

function renderRoomTypeDetailPage() {
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
        createRoute({ getParentRoute: () => layoutRoute, path: "room-types/" }),
        roomTypeRoute.addChildren([
          createRoute({
            getParentRoute: () => roomTypeRoute,
            path: "/",
            component: RoomTypeDetailPage,
          }),
          createRoute({ getParentRoute: () => roomTypeRoute, path: "edit" }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/room-types/${ROOM_TYPE.id}`],
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("RoomTypeDetailPage", () => {
  it("유형의 이름·최대 인원·1박 요금·체크인 시각·체크아웃 시각을 보여주고 목록으로 링크와 수정 버튼을 둔다", async () => {
    fetchRoomType.mockResolvedValue(ROOM_TYPE);
    renderRoomTypeDetailPage();

    const terms = await screen.findAllByRole("term");
    expect(terms.map((term) => term.textContent)).toEqual([
      ROOM_TYPE_FIELD_LABELS.name,
      ROOM_TYPE_FIELD_LABELS.capacity,
      ROOM_TYPE_FIELD_LABELS.roomRate,
      ROOM_TYPE_FIELD_LABELS.checkInTime,
      ROOM_TYPE_FIELD_LABELS.checkOutTime,
    ]);
    expect(
      screen.getAllByRole("definition").map((value) => value.textContent),
    ).toEqual([
      ROOM_TYPE.name,
      String(ROOM_TYPE.capacity),
      formatWon(ROOM_TYPE.roomRate),
      ROOM_TYPE.checkInTime,
      ROOM_TYPE.checkOutTime,
    ]);
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveAttribute("href", "/room-types");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.edit }),
    ).toHaveAttribute("href", `/room-types/${ROOM_TYPE.id}/edit`);
    expect(fetchRoomType).toHaveBeenCalledExactlyOnceWith(ROOM_TYPE.id);
  });
});
