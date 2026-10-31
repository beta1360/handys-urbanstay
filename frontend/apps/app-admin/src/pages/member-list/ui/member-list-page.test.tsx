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
import { MEMBER_FIELD_LABELS } from "@/entities/member";
import { MEMBER_SEARCH_FORM_MESSAGES } from "@/features/member-search";
import type { Member, MemberPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { MEMBER_LIST_CONTENT_MESSAGES } from "@/widgets/member-list";
import {
  MEMBER_LIST_DEFAULT_SEARCH,
  memberListSearchSchema,
} from "../model/member-list-search";
import { MemberListPage } from "./member-list-page";

const { fetchMembers } = vi.hoisted(() => ({ fetchMembers: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchMembers: (params: Parameters<typeof actual.fetchMembers>[0]) =>
      fetchMembers(params),
  };
});

const MEMBERS: Member[] = [
  {
    id: 2,
    email: "kim@example.com",
    name: "김회원",
    phone: "010-1234-5678",
    createdAt: "2026-10-30T06:59:32Z",
  },
  {
    id: 1,
    email: "lee@example.com",
    name: "이회원",
    phone: "010-9876-5432",
    createdAt: "2026-10-29T01:00:00Z",
  },
];

function createMemberPage(overrides: Partial<MemberPage> = {}): MemberPage {
  return {
    items: MEMBERS,
    page: 0,
    size: 10,
    totalElements: MEMBERS.length,
    totalPages: 1,
    ...overrides,
  };
}

function renderMemberListPage(initialPath = "/members") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const memberListRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "members/",
    validateSearch: memberListSearchSchema,
    search: { middlewares: [stripSearchParams(MEMBER_LIST_DEFAULT_SEARCH)] },
    component: MemberListPage,
  });
  const memberDetailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "members/$memberId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([memberListRoute, memberDetailRoute]),
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
  return router;
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchMembers.mockResolvedValue(createMemberPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("MemberListPage", () => {
  it("회원을 이름·이메일·전화번호 열의 표로 보여주고 이름은 상세 링크다", async () => {
    renderMemberListPage();

    const table = await screen.findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      MEMBER_FIELD_LABELS.name,
      MEMBER_FIELD_LABELS.email,
      MEMBER_FIELD_LABELS.phone,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual(
      MEMBERS.map((member) => [member.name, member.email, member.phone]),
    );
    expect(screen.getByRole("link", { name: MEMBERS[0].name })).toHaveAttribute(
      "href",
      `/members/${MEMBERS[0].id}`,
    );
    expect(fetchMembers).toHaveBeenCalledExactlyOnceWith({ page: 0 });
  });

  it("URL의 검색어와 페이지로 조회하고 검색창에 검색어를 채운다", async () => {
    fetchMembers.mockResolvedValue(createMemberPage({ page: 1, totalPages: 2 }));
    renderMemberListPage("/members?keyword=010-1234&page=2");

    expect(
      await screen.findByText(COMMON_MESSAGES.pageStatus(2, 2)),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(MEMBER_SEARCH_FORM_MESSAGES.keywordLabel),
    ).toHaveValue("010-1234");
    expect(fetchMembers).toHaveBeenCalledWith({
      keyword: "010-1234",
      page: 1,
    });
  });

  it("검색하면 앞뒤 공백을 지운 검색어로 1페이지 URL로 간다", async () => {
    const user = userEvent.setup();
    const router = renderMemberListPage("/members?page=2");
    const input = await screen.findByLabelText(
      MEMBER_SEARCH_FORM_MESSAGES.keywordLabel,
    );

    await user.type(input, "  kim@example  ");
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.search }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/members?keyword=kim%40example");
    });
    expect(input).toHaveValue("kim@example");
    expect(fetchMembers).toHaveBeenLastCalledWith({
      keyword: "kim@example",
      page: 0,
    });
  });

  it.each([
    ["검색어가 없으면", "/members", MEMBER_LIST_CONTENT_MESSAGES.empty],
    [
      "검색어가 있으면",
      "/members?keyword=%EC%97%86%EC%9D%8C",
      COMMON_MESSAGES.emptySearchResult,
    ],
  ])("결과가 없을 때 %s 그에 맞는 빈 상태 문구를 보여준다", async (_, path, text) => {
    fetchMembers.mockResolvedValue(
      createMemberPage({ items: [], totalElements: 0, totalPages: 0 }),
    );
    renderMemberListPage(path);

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: COMMON_MESSAGES.paginationLabel,
      }),
    ).not.toBeInTheDocument();
  });
});
