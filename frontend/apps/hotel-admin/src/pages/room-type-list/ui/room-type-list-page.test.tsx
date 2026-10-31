import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROOM_TYPE_FIELD_LABELS } from "@/entities/room-type";
import type { RoomType } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { ROOM_TYPE_LIST_CONTENT_MESSAGES } from "@/widgets/room-type-list";
import { ROOM_TYPE_LIST_MESSAGES } from "../config/messages";
import { RoomTypeListPage } from "./room-type-list-page";

const { fetchRoomTypes } = vi.hoisted(() => ({ fetchRoomTypes: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchRoomTypes: () => fetchRoomTypes(),
}));

const ROOM_TYPES: RoomType[] = [
  {
    id: 2,
    name: "스위트",
    capacity: 4,
    roomRate: 1250000,
    checkInTime: "16:00",
    checkOutTime: "12:00",
    version: 0,
  },
  {
    id: 1,
    name: "스탠다드",
    capacity: 2,
    roomRate: 0,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    version: 1,
  },
];

function renderRoomTypeListPage() {
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
          path: "room-types/",
          component: RoomTypeListPage,
        }),
        createRoute({ getParentRoute: () => layoutRoute, path: "room-types/new" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "room-types/$roomTypeId",
        }),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: ["/room-types"] }),
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

describe("RoomTypeListPage", () => {
  it("유형을 서버 순서대로 이름·최대 인원·1박 요금·체크인·체크아웃 시각 열의 표로 보여주고 요금은 천 단위로 끊어 원을 붙인다", async () => {
    fetchRoomTypes.mockResolvedValue(ROOM_TYPES);
    renderRoomTypeListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      ROOM_TYPE_FIELD_LABELS.name,
      ROOM_TYPE_FIELD_LABELS.capacity,
      ROOM_TYPE_FIELD_LABELS.roomRate,
      ROOM_TYPE_FIELD_LABELS.checkInTime,
      ROOM_TYPE_FIELD_LABELS.checkOutTime,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ),
    ).toEqual([
      ["스위트", "4", formatWon(1250000), "16:00", "12:00"],
      ["스탠다드", "2", formatWon(0), "15:00", "11:00"],
    ]);
    expect(formatWon(1250000)).toBe("1,250,000원");
    expect(screen.getByRole("link", { name: "스위트" })).toHaveAttribute(
      "href",
      "/room-types/2",
    );
    expect(
      screen.getByRole("link", { name: ROOM_TYPE_LIST_MESSAGES.create }),
    ).toHaveAttribute("href", "/room-types/new");
  });

  it("유형이 없으면 빈 목록 문구를 보여준다", async () => {
    fetchRoomTypes.mockResolvedValue([]);
    renderRoomTypeListPage();

    expect(
      await screen.findByText(ROOM_TYPE_LIST_CONTENT_MESSAGES.empty),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
