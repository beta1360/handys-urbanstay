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
import {
  OPERATOR_ACTIVE_LABELS,
  OPERATOR_FIELD_LABELS,
} from "@/entities/operator";
import { OPERATOR_SEARCH_FORM_MESSAGES } from "@/features/operator-search";
import type { Operator, OperatorPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { OPERATOR_LIST_CONTENT_MESSAGES } from "@/widgets/operator-list";
import {
  OPERATOR_LIST_DEFAULT_SEARCH,
  operatorListSearchSchema,
} from "../model/operator-list-search";
import { OperatorListPage } from "./operator-list-page";

const { fetchOperators } = vi.hoisted(() => ({ fetchOperators: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchOperators: (params: Parameters<typeof actual.fetchOperators>[0]) =>
      fetchOperators(params),
  };
});

const OPERATORS: Operator[] = [
  {
    id: 4,
    loginId: "lee@example.com",
    name: "이운영",
    active: true,
    version: 0,
  },
  {
    id: 3,
    loginId: "kim@example.com",
    name: "김운영",
    active: false,
    version: 1,
  },
];

const KEYWORD = "운영";

function createOperatorPage(
  overrides: Partial<OperatorPage> = {},
): OperatorPage {
  return {
    items: OPERATORS,
    page: 0,
    size: 10,
    totalElements: OPERATORS.length,
    totalPages: 1,
    ...overrides,
  };
}

function operatorsPath(search: Record<string, string> = {}) {
  const searchString = new URLSearchParams(search).toString();
  return searchString ? `/operators?${searchString}` : "/operators";
}

function renderOperatorListPage(initialPath = operatorsPath()) {
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
          path: "operators/",
          validateSearch: operatorListSearchSchema,
          search: {
            middlewares: [stripSearchParams(OPERATOR_LIST_DEFAULT_SEARCH)],
          },
          component: OperatorListPage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "operators/$operatorId",
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

function findKeywordInput() {
  return screen.findByLabelText(OPERATOR_SEARCH_FORM_MESSAGES.keywordLabel);
}

function getActiveSelect() {
  return screen.getByRole("combobox", { name: OPERATOR_FIELD_LABELS.active });
}

beforeEach(() => {
  fetchOperators.mockResolvedValue(createOperatorPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("OperatorListPage 목록", () => {
  it("운영자를 이름·아이디·사용 여부 열의 표로 보여주고 이름은 상세 화면 링크다", async () => {
    renderOperatorListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      OPERATOR_FIELD_LABELS.name,
      OPERATOR_FIELD_LABELS.loginId,
      OPERATOR_FIELD_LABELS.active,
    ]);
    const [, firstRow, secondRow] = within(table).getAllByRole("row");
    expect(
      within(firstRow)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual([
      OPERATORS[0].name,
      OPERATORS[0].loginId,
      OPERATOR_ACTIVE_LABELS.active,
    ]);
    expect(within(secondRow).getAllByRole("cell")[2]).toHaveTextContent(
      OPERATOR_ACTIVE_LABELS.inactive,
    );
    expect(
      within(firstRow).getByRole("link", { name: OPERATORS[0].name }),
    ).toHaveAttribute("href", `/operators/${OPERATORS[0].id}`);
  });
});

describe("OperatorListPage 검색과 사용 여부 거르기", () => {
  it("사용 여부 선택지는 전체·사용 중·사용 안 함이다", async () => {
    renderOperatorListPage();

    await findKeywordInput();
    expect(
      within(getActiveSelect())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      COMMON_MESSAGES.all,
      OPERATOR_ACTIVE_LABELS.active,
      OPERATOR_ACTIVE_LABELS.inactive,
    ]);
  });

  it.each([
    [OPERATOR_ACTIVE_LABELS.active, true],
    [OPERATOR_ACTIVE_LABELS.inactive, false],
  ])(
    "검색어와 사용 여부(%s)를 고른 뒤 검색하면 URL에 남기고 1페이지를 조회한다",
    async (label, active) => {
      fetchOperators.mockResolvedValue(createOperatorPage({ totalPages: 3 }));
      const { router, user } = renderOperatorListPage(
        operatorsPath({ page: "2" }),
      );

      await user.type(await findKeywordInput(), `  ${KEYWORD}  `);
      await user.selectOptions(getActiveSelect(), label);
      await user.click(
        screen.getByRole("button", { name: COMMON_MESSAGES.search }),
      );

      await vi.waitFor(() => {
        expect(router.state.location.href).toBe(
          operatorsPath({ keyword: KEYWORD, active: String(active) }),
        );
      });
      expect(fetchOperators).toHaveBeenLastCalledWith({
        keyword: KEYWORD,
        active,
        page: 0,
      });
    },
  );

  it("URL의 사용 여부로 처음 조회하고 선택에 보여준다", async () => {
    renderOperatorListPage(operatorsPath({ active: "false" }));

    await screen.findByRole("table");
    expect(fetchOperators).toHaveBeenCalledExactlyOnceWith({
      active: false,
      page: 0,
    });
    expect(getActiveSelect()).toHaveValue("false");
  });

  it.each(["TRUE", "1", ""])(
    "URL의 사용 여부가 %s처럼 정해진 값이 아니면 거르지 않고 URL에서 지운다",
    async (active) => {
      const { router } = renderOperatorListPage(operatorsPath({ active }));

      await screen.findByRole("table");
      expect(router.state.location.href).toBe(operatorsPath());
      expect(fetchOperators).toHaveBeenCalledExactlyOnceWith({ page: 0 });
    },
  );

  it.each([
    ["거르지 않은 목록", operatorsPath(), OPERATOR_LIST_CONTENT_MESSAGES.empty],
    [
      "사용 여부로 거른 목록",
      operatorsPath({ active: "true" }),
      COMMON_MESSAGES.emptySearchResult,
    ],
  ])("%s이 비면 그에 맞는 빈 상태 문구를 보여준다", async (_, path, text) => {
    fetchOperators.mockResolvedValue(
      createOperatorPage({ items: [], totalElements: 0, totalPages: 0 }),
    );
    renderOperatorListPage(path);

    expect(await screen.findByText(text)).toBeInTheDocument();
  });
});

describe("OperatorListPage 페이지 이동과 불러오기 실패", () => {
  it("다음·이전을 누르면 검색어와 사용 여부를 둔 채 그 페이지로 URL을 바꿔 조회한다", async () => {
    fetchOperators.mockImplementation(({ page }: { page: number }) =>
      Promise.resolve(createOperatorPage({ page, totalPages: 3 })),
    );
    const { router, user } = renderOperatorListPage(
      operatorsPath({ keyword: KEYWORD, active: "true" }),
    );

    await screen.findByRole("table");
    const previousButton = screen.getByRole("button", {
      name: COMMON_MESSAGES.previousPage,
    });
    expect(previousButton).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.nextPage }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        operatorsPath({ keyword: KEYWORD, active: "true", page: "2" }),
      );
    });
    expect(fetchOperators).toHaveBeenLastCalledWith({
      keyword: KEYWORD,
      active: true,
      page: 1,
    });

    await user.click(previousButton);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(
        operatorsPath({ keyword: KEYWORD, active: "true" }),
      );
    });
  });

  it("목록을 불러오지 못하면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    fetchOperators.mockRejectedValueOnce(new Error("서버 오류"));
    const { user } = renderOperatorListPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_LIST_CONTENT_MESSAGES.loadFailed,
    );

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchOperators).toHaveBeenCalledTimes(2);
  });
});
