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
import { ROOM_FIELD_LABELS } from "@/entities/room";
import { SETTLEMENT_FIELD_LABELS } from "@/entities/settlement";
import { STAY_CANCELED_LABELS, STAY_FIELD_LABELS } from "@/entities/stay";
import { SETTLEMENT_MONTH_CHANGE_MESSAGES } from "@/features/settlement-month-change";
import type {
  Settlement,
  SettlementStay,
  SettlementStayPage,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { formatWon } from "@/shared/lib/money";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { SETTLEMENT_STAY_LIST_MESSAGES } from "@/widgets/settlement-stay-list";
import { SETTLEMENT_SUMMARY_MESSAGES } from "@/widgets/settlement-summary";
import {
  SETTLEMENT_DEFAULT_SEARCH,
  settlementSearchSchema,
} from "../model/settlement-search";
import { SettlementPage } from "./settlement-page";

const { fetchSettlement, fetchSettlementStays } = vi.hoisted(() => ({
  fetchSettlement: vi.fn(),
  fetchSettlementStays: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchSettlement: (params: Parameters<typeof actual.fetchSettlement>[0]) =>
      fetchSettlement(params),
    fetchSettlementStays: (
      params: Parameters<typeof actual.fetchSettlementStays>[0],
    ) => fetchSettlementStays(params),
  };
});

const TODAY = new Date("2026-10-31T14:30:00Z");

const SETTLEMENT: Settlement = {
  month: "2026-10",
  totalAmount: 1250000,
  stayCount: 3,
  canceledCount: 1,
};

const SETTLEMENT_STAYS: SettlementStay[] = [
  {
    id: 11,
    room: { id: 2, name: "101" },
    roomType: { id: 1, name: "스탠다드" },
    guest: { id: 3, name: "김이용" },
    checkInDate: "2026-10-02",
    checkOutDate: "2026-10-04",
    nights: 2,
    totalAmount: 200000,
    canceledAt: null,
  },
  {
    id: 12,
    room: { id: 1, name: "스위트 A" },
    roomType: { id: 2, name: "스위트" },
    guest: { id: 4, name: "박손님" },
    checkInDate: "2026-10-20",
    checkOutDate: "2026-10-21",
    nights: 1,
    totalAmount: 300000,
    canceledAt: "2026-10-15T06:59:32.123456Z",
  },
];

function createStayPage(items: SettlementStay[] = SETTLEMENT_STAYS) {
  return {
    items,
    page: 0,
    size: 10,
    totalElements: items.length,
    totalPages: items.length === 0 ? 0 : 1,
  };
}

function renderSettlementPage(initialPath = "/settlements") {
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
          path: "settlements/",
          validateSearch: settlementSearchSchema,
          search: {
            middlewares: [stripSearchParams(SETTLEMENT_DEFAULT_SEARCH)],
          },
          component: SettlementPage,
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

function getCellTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
  fetchSettlement.mockResolvedValue(SETTLEMENT);
  fetchSettlementStays.mockResolvedValue(createStayPage());
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("SettlementPage", () => {
  it("이번 달 정산 금액·이용 건수·취소 건수와 이 달의 이용 표를 보여준다", async () => {
    const { router } = renderSettlementPage();

    const table = await screen.findByRole("table");
    expect(router.state.location.search).toEqual({ month: "2026-10" });
    expect(
      screen.getByRole("heading", { name: "2026년 10월" }),
    ).toBeInTheDocument();
    expect(fetchSettlement).toHaveBeenCalledWith({ month: "2026-10" });
    expect(fetchSettlementStays).toHaveBeenCalledWith({
      month: "2026-10",
      page: 0,
    });

    expect(
      (await screen.findAllByRole("term")).map((term) => term.textContent),
    ).toEqual([
      SETTLEMENT_FIELD_LABELS.totalAmount,
      SETTLEMENT_FIELD_LABELS.stayCount,
      SETTLEMENT_FIELD_LABELS.canceledCount,
    ]);
    expect(
      screen
        .getAllByRole("definition")
        .map((definition) => definition.textContent),
    ).toEqual([formatWon(1250000), "3", "1"]);
    expect(
      screen.getByText(SETTLEMENT_SUMMARY_MESSAGES.basis),
    ).toBeInTheDocument();

    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      STAY_FIELD_LABELS.room,
      ROOM_FIELD_LABELS.roomType,
      STAY_FIELD_LABELS.guest,
      STAY_FIELD_LABELS.checkInDate,
      STAY_FIELD_LABELS.checkOutDate,
      STAY_FIELD_LABELS.nights,
      STAY_FIELD_LABELS.amount,
      STAY_FIELD_LABELS.canceled,
      SETTLEMENT_STAY_LIST_MESSAGES.detailHeader,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getCellTexts)).toEqual([
      [
        "101",
        "스탠다드",
        "김이용",
        "2026-10-02",
        "2026-10-04",
        "2",
        formatWon(200000),
        "",
        SETTLEMENT_STAY_LIST_MESSAGES.detailLink,
      ],
      [
        "스위트 A",
        "스위트",
        "박손님",
        "2026-10-20",
        "2026-10-21",
        "1",
        formatWon(300000),
        STAY_CANCELED_LABELS.true,
        SETTLEMENT_STAY_LIST_MESSAGES.detailLink,
      ],
    ]);
    expect(
      within(rows[1]).getByRole("link", {
        name: SETTLEMENT_STAY_LIST_MESSAGES.detailLink,
      }),
    ).toHaveAttribute("href", "/stays/12");
  });

  it.each(["/settlements?month=2026-13", "/settlements?month=2026-1"])(
    "%s처럼 달이 잘못되면 이번 달로 바꾼다",
    async (path) => {
      const { router } = renderSettlementPage(path);

      expect(
        await screen.findByRole("heading", { name: "2026년 10월" }),
      ).toBeInTheDocument();
      expect(router.state.location.search).toEqual({ month: "2026-10" });
      expect(fetchSettlement).toHaveBeenCalledWith({ month: "2026-10" });
    },
  );

  it("이 달에 체크인한 이용이 없으면 빈 상태 문구를 보여준다", async () => {
    fetchSettlementStays.mockResolvedValue(createStayPage([]));
    renderSettlementPage();

    expect(
      await screen.findByText(SETTLEMENT_STAY_LIST_MESSAGES.empty),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it.each([
    [SETTLEMENT_MONTH_CHANGE_MESSAGES.previousMonth, "2025-12", "2025년 12월"],
    [SETTLEMENT_MONTH_CHANGE_MESSAGES.nextMonth, "2026-02", "2026년 2월"],
  ])(
    "'%s'를 누르면 1페이지의 %s로 URL을 바꾸고 그 달을 다시 불러온다",
    async (buttonLabel, month, monthLabel) => {
      const { router, user } = renderSettlementPage(
        "/settlements?month=2026-01&page=2",
      );
      await screen.findByRole("table");

      await user.click(screen.getByRole("button", { name: buttonLabel }));

      expect(
        await screen.findByRole("heading", { name: monthLabel }),
      ).toBeInTheDocument();
      expect(router.state.location.search).toEqual({ month });
      expect(fetchSettlement).toHaveBeenLastCalledWith({ month });
      expect(fetchSettlementStays).toHaveBeenLastCalledWith({
        month,
        page: 0,
      });
    },
  );
});

describe("SettlementPage 이 달 이용 페이지 이동", () => {
  it("같은 달에서 다음을 누르면 불러오는 동안 이전 목록을 흐리게 두고 다음 페이지를 보여주며, 이전을 누르면 1페이지로 돌아온다", async () => {
    let resolveNextPage: (page: SettlementStayPage) => void = () => {};
    fetchSettlementStays.mockImplementation(({ page }: { page: number }) =>
      page === 0
        ? Promise.resolve({ ...createStayPage(), totalPages: 2 })
        : new Promise<SettlementStayPage>((resolve) => {
            resolveNextPage = resolve;
          }),
    );
    const { router, user } = renderSettlementPage();
    await screen.findByRole("table");

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.nextPage }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        "/settlements?month=2026-10&page=2",
      );
    });
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText(SETTLEMENT_STAYS[0].guest.name),
    ).toBeInTheDocument();

    resolveNextPage({
      ...createStayPage([SETTLEMENT_STAYS[1]]),
      page: 1,
      totalPages: 2,
    });

    await vi.waitFor(() => {
      expect(screen.getByRole("table")).not.toHaveAttribute("aria-busy");
    });
    expect(
      screen.queryByText(SETTLEMENT_STAYS[0].guest.name),
    ).not.toBeInTheDocument();
    expect(fetchSettlementStays).toHaveBeenLastCalledWith({
      month: "2026-10",
      page: 1,
    });
    expect(fetchSettlement).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.previousPage }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/settlements?month=2026-10");
    });
    expect(
      await screen.findByText(SETTLEMENT_STAYS[0].guest.name),
    ).toBeInTheDocument();
  });

  it("URL의 페이지가 마지막 페이지보다 크면 같은 달의 마지막 페이지로 방문 기록을 바꿔 이동한다", async () => {
    fetchSettlementStays.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve({
        ...createStayPage(page > 1 ? [] : SETTLEMENT_STAYS),
        page,
        totalPages: 2,
      }),
    );
    const { router } = renderSettlementPage(
      "/settlements?month=2026-10&page=50",
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        "/settlements?month=2026-10&page=2",
      );
    });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(router.history.length).toBe(1);
  });
});

describe("SettlementPage 불러오기 실패", () => {
  it.each([
    ["요약", fetchSettlement, SETTLEMENT_SUMMARY_MESSAGES.loadFailed],
    [
      "이 달 이용 표",
      fetchSettlementStays,
      SETTLEMENT_STAY_LIST_MESSAGES.loadFailed,
    ],
  ])(
    "%s를 불러오지 못하면 그 자리에만 오류 문구와 다시 시도를 보여주고, 누르면 다시 불러온다",
    async (_, request, message) => {
      request.mockRejectedValueOnce(new Error("서버 오류"));
      const { user } = renderSettlementPage();

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(
        screen.getByText(SETTLEMENT_SUMMARY_MESSAGES.basis),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
      );

      expect(await screen.findByRole("table")).toBeInTheDocument();
      expect(await screen.findAllByRole("term")).toHaveLength(3);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(request).toHaveBeenCalledTimes(2);
    },
  );
});
