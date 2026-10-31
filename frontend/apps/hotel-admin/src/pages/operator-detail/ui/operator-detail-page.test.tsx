import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OPERATOR_ACTIVE_LABELS,
  OPERATOR_FIELD_LABELS,
  OPERATOR_NOT_FOUND_MESSAGES,
  parseOperatorPathParams,
  stringifyOperatorPathParams,
} from "@/entities/operator";
import { API_ERROR_CODES } from "@/shared/api";
import type { Operator } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { OperatorDetailPage } from "./operator-detail-page";

const { fetchOperator } = vi.hoisted(() => ({ fetchOperator: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchOperator: (operatorId: number) => fetchOperator(operatorId),
}));

const OPERATOR: Operator = {
  id: 3,
  loginId: "kim@example.com",
  name: "김운영",
  active: true,
  version: 2,
};

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

function renderOperatorDetailPage(operatorId: string | number = OPERATOR.id) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const operatorRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "operators/$operatorId",
    params: {
      parse: parseOperatorPathParams,
      stringify: stringifyOperatorPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "operators/" }),
        operatorRoute.addChildren([
          createRoute({
            getParentRoute: () => operatorRoute,
            path: "/",
            component: OperatorDetailPage,
          }),
          createRoute({ getParentRoute: () => operatorRoute, path: "edit" }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/operators/${operatorId}`],
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("OperatorDetailPage 내용", () => {
  it("운영자의 이름·아이디·사용 여부를 항목 목록으로 보여주고 위쪽에 목록으로 링크를 둔다", async () => {
    fetchOperator.mockResolvedValue(OPERATOR);
    renderOperatorDetailPage();

    expect(await screen.findByText(OPERATOR.name)).toBeInTheDocument();
    for (const term of Object.values(OPERATOR_FIELD_LABELS)) {
      expect(screen.getByText(term)).toBeInTheDocument();
    }
    expect(screen.getByText(OPERATOR.loginId)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_ACTIVE_LABELS.active)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveAttribute("href", "/operators");
    expect(fetchOperator).toHaveBeenCalledExactlyOnceWith(OPERATOR.id);
  });

  it("운영자가 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchOperator.mockRejectedValue(
      createAxiosError(
        404,
        API_ERROR_CODES.operatorNotFound,
        OPERATOR_NOT_FOUND_MESSAGES.description,
      ),
    );
    renderOperatorDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_NOT_FOUND_MESSAGES.description,
    );
    expect(
      screen.getAllByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveLength(1);
  });

  it("id가 잘못되면 요청하지 않고 찾을 수 없음을 보여준다", async () => {
    renderOperatorDetailPage("abc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_NOT_FOUND_MESSAGES.description,
    );
    expect(fetchOperator).not.toHaveBeenCalled();
  });
});
