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
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { ACCESS_MESSAGES } from "@/shared/config";
import { HotelDetail } from "@/widgets/hotel-detail";
import { OperatorList } from "@/widgets/operator-list";
import { SettlementStayList } from "@/widgets/settlement-stay-list";
import { SettlementSummary } from "@/widgets/settlement-summary";
import { MasterAccessPage } from "./master-access-page";

const { fetchHotel, fetchOperators, fetchSettlement, fetchSettlementStays } =
  vi.hoisted(() => ({
    fetchHotel: vi.fn(),
    fetchOperators: vi.fn(),
    fetchSettlement: vi.fn(),
    fetchSettlementStays: vi.fn(),
  }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotel,
  fetchOperators,
  fetchSettlement,
  fetchSettlementStays,
}));

const MASTER_ONLY_SECTIONS = {
  operators: {
    path: "operators",
    component: () => (
      <OperatorList keyword={undefined} active={undefined} page={1} />
    ),
  },
  hotel: {
    path: "hotel",
    component: () => <HotelDetail />,
  },
  settlements: {
    path: "settlements",
    component: () => (
      <>
        <SettlementSummary month="2026-11" />
        <SettlementStayList month="2026-11" page={1} />
      </>
    ),
  },
} as const;

const OPERATOR = {
  id: 3,
  loginId: "kim@example.com",
  name: "김운영",
  active: true,
  version: 0,
};

function renderMasterAccessPage(
  isMaster: boolean,
  section: keyof typeof MASTER_ONLY_SECTIONS = "operators",
) {
  const { path, component } = MASTER_ONLY_SECTIONS[section];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const sectionRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path,
    beforeLoad: () => ({ isMaster }),
    component: MasterAccessPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        sectionRoute.addChildren([
          createRoute({
            getParentRoute: () => sectionRoute,
            path: "/",
            component,
          }),
        ]),
        createRoute({ getParentRoute: () => layoutRoute, path: "rooms" }),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/${path}`] }),
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

describe("MasterAccessPage", () => {
  it.each([
    ["operators", [fetchOperators]],
    ["hotel", [fetchHotel]],
    ["settlements", [fetchSettlement, fetchSettlementStays]],
  ] as const)(
    "/%s에서 마스터가 아니면 요청 없이 권한이 없다는 문구와 객실 목록 버튼만 보여준다",
    async (section, requests) => {
      renderMasterAccessPage(false, section);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        ACCESS_MESSAGES.forbidden,
      );
      expect(
        screen.getByRole("link", { name: ACCESS_MESSAGES.backToRooms }),
      ).toHaveAttribute("href", "/rooms");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      for (const request of requests) {
        expect(request).not.toHaveBeenCalled();
      }
    },
  );

  it("마스터면 하위 화면을 그린다", async () => {
    fetchOperators.mockResolvedValue({
      items: [OPERATOR],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });
    renderMasterAccessPage(true);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchOperators).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
