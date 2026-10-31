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
import { OperatorList } from "@/widgets/operator-list";
import { OPERATOR_ACCESS_MESSAGES } from "../config/messages";
import { OperatorAccessPage } from "./operator-access-page";

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

function renderOperatorAccessPage(isMaster: boolean) {
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
    component: OperatorAccessPage,
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

describe("OperatorAccessPage", () => {
  it("마스터가 아니면 요청 없이 권한이 없다는 문구와 객실 목록 버튼만 보여준다", async () => {
    renderOperatorAccessPage(false);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_ACCESS_MESSAGES.forbidden,
    );
    expect(
      screen.getByRole("link", { name: OPERATOR_ACCESS_MESSAGES.backToRooms }),
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
    renderOperatorAccessPage(true);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchOperators).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
