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
import { OperatorList } from "@/widgets/operator-list";
import { MasterAccessPage } from "./master-access-page";

const { fetchOperators } = vi.hoisted(() => ({ fetchOperators: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchOperators,
}));

const OPERATOR = {
  id: 3,
  loginId: "kim@example.com",
  name: "김운영",
  active: true,
  version: 0,
};

function renderMasterAccessPage(isMaster: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const operatorsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "operators",
    beforeLoad: () => ({ isMaster }),
    component: MasterAccessPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        operatorsRoute.addChildren([
          createRoute({
            getParentRoute: () => operatorsRoute,
            path: "/",
            component: () => (
              <OperatorList keyword={undefined} active={undefined} page={1} />
            ),
          }),
        ]),
        createRoute({ getParentRoute: () => layoutRoute, path: "rooms" }),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: ["/operators"] }),
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
  it("마스터가 아니면 요청 없이 권한이 없다는 문구와 객실 목록 버튼만 보여준다", async () => {
    renderMasterAccessPage(false);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ACCESS_MESSAGES.forbidden,
    );
    expect(
      screen.getByRole("link", { name: ACCESS_MESSAGES.backToRooms }),
    ).toHaveAttribute("href", "/rooms");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(fetchOperators).not.toHaveBeenCalled();
  });

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
