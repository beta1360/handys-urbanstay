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
  MEMBER_FIELD_LABELS,
  MEMBER_NOT_FOUND_MESSAGES,
  parseMemberPathParams,
  stringifyMemberPathParams,
} from "@/entities/member";
import { ROOM_FIELD_LABELS } from "@/entities/room";
import { API_ERROR_CODES } from "@/shared/api";
import type { Member, MemberStay, MemberStayPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { MEMBER_STAY_HISTORY_MESSAGES } from "@/widgets/member-detail";
import { MemberDetailPage } from "./member-detail-page";

const { fetchMember, fetchMemberStays } = vi.hoisted(() => ({
  fetchMember: vi.fn(),
  fetchMemberStays: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchMember: (memberId: number) => fetchMember(memberId),
    fetchMemberStays: (memberId: number, params: { page?: number }) =>
      fetchMemberStays(memberId, params),
  };
});

const MEMBER: Member = {
  id: 3,
  email: "kim@example.com",
  name: "김회원",
  phone: "010-1234-5678",
  createdAt: "2026-10-30T15:30:00Z",
};

const STAYS: MemberStay[] = [
  {
    id: 12,
    hotel: { id: 2, name: "어반스테이 해운대" },
    room: { id: 7, name: "1203" },
    roomType: { id: 4, name: "디럭스" },
    checkInDate: "2026-11-20",
    checkOutDate: "2026-11-23",
    guestCount: 3,
    roomRate: 150000,
    nights: 3,
    baseAmount: 450000,
    discountAmount: 0,
    totalAmount: 450000,
    canceledAt: "2026-10-31T01:00:00Z",
  },
  {
    id: 11,
    hotel: { id: 1, name: "어반스테이 강남" },
    room: { id: 5, name: "101" },
    roomType: { id: 2, name: "스탠다드" },
    checkInDate: "2026-11-02",
    checkOutDate: "2026-11-04",
    guestCount: 2,
    roomRate: 100000,
    nights: 2,
    baseAmount: 200000,
    discountAmount: 0,
    totalAmount: 200000,
    canceledAt: null,
  },
];

function createStayPage(
  overrides: Partial<MemberStayPage> = {},
): MemberStayPage {
  return {
    items: STAYS,
    page: 0,
    size: 10,
    totalElements: STAYS.length,
    totalPages: 1,
    ...overrides,
  };
}

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message: "요청을 처리하지 못했습니다.", fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderMemberDetailPage(initialPath = `/members/${MEMBER.id}`) {
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
  });
  const memberDetailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "members/$memberId",
    params: {
      parse: parseMemberPathParams,
      stringify: stringifyMemberPathParams,
    },
    component: MemberDetailPage,
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

function getStaySection() {
  return screen.findByRole("region", {
    name: MEMBER_STAY_HISTORY_MESSAGES.title,
  });
}

function getRowTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

beforeEach(() => {
  fetchMember.mockResolvedValue(MEMBER);
  fetchMemberStays.mockResolvedValue(createStayPage());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("MemberDetailPage 회원 정보", () => {
  it("이름·이메일·전화번호·가입일(한국 날짜)과 '목록으로' 링크를 보여준다", async () => {
    renderMemberDetailPage();

    const term = await screen.findByText(MEMBER_FIELD_LABELS.createdAt);
    expect(term.nextElementSibling).toHaveTextContent("2026-10-31");
    expect(screen.getByText(MEMBER.name)).toBeInTheDocument();
    expect(screen.getByText(MEMBER.email)).toBeInTheDocument();
    expect(screen.getByText(MEMBER.phone)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveAttribute("href", "/members");
    expect(fetchMember).toHaveBeenCalledExactlyOnceWith(MEMBER.id);
  });

  it.each([
    ["잘못된 id면 요청 없이", "/members/abc", 0],
    ["404 MEMBER_NOT_FOUND면", `/members/${MEMBER.id}`, 1],
  ])("%s 찾을 수 없음만 보여준다", async (_, path, memberRequests) => {
    fetchMember.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.memberNotFound),
    );
    renderMemberDetailPage(path);

    expect(
      await screen.findByText(MEMBER_NOT_FOUND_MESSAGES.description),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(fetchMemberStays).not.toHaveBeenCalled();
    expect(fetchMember).toHaveBeenCalledTimes(memberRequests);
  });
});

describe("MemberDetailPage 호텔 이용 기록", () => {
  it("호텔·객실·유형·기간·인원·최종 금액·취소 여부를 표로 보여준다", async () => {
    renderMemberDetailPage();

    const section = await getStaySection();
    const table = await within(section).findByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      MEMBER_STAY_HISTORY_MESSAGES.hotel,
      ROOM_FIELD_LABELS.room,
      ROOM_FIELD_LABELS.type,
      MEMBER_STAY_HISTORY_MESSAGES.period,
      MEMBER_STAY_HISTORY_MESSAGES.guestCount,
      MEMBER_STAY_HISTORY_MESSAGES.totalAmount,
      MEMBER_STAY_HISTORY_MESSAGES.canceled,
    ]);
    const [, ...rows] = within(table).getAllByRole("row");
    expect(rows.map(getRowTexts)).toEqual([
      [
        "어반스테이 해운대",
        "1203",
        "디럭스",
        "2026-11-20 ~ 2026-11-23 (3박)",
        "3명",
        "450,000원",
        MEMBER_STAY_HISTORY_MESSAGES.canceledValue,
      ],
      [
        "어반스테이 강남",
        "101",
        "스탠다드",
        "2026-11-02 ~ 2026-11-04 (2박)",
        "2명",
        "200,000원",
        "",
      ],
    ]);
    expect(fetchMemberStays).toHaveBeenCalledExactlyOnceWith(MEMBER.id, {
      page: 0,
    });
  });

  it("다음 페이지를 누르면 URL은 그대로 두고 다음 페이지를 조회한다", async () => {
    const user = userEvent.setup();
    fetchMemberStays.mockResolvedValue(createStayPage({ totalPages: 2 }));
    const router = renderMemberDetailPage();
    const section = await getStaySection();

    await user.click(
      await within(section).findByRole("button", {
        name: COMMON_MESSAGES.nextPage,
      }),
    );

    expect(
      await within(section).findByText(COMMON_MESSAGES.pageStatus(2, 2)),
    ).toBeInTheDocument();
    expect(fetchMemberStays).toHaveBeenLastCalledWith(MEMBER.id, { page: 1 });
    expect(router.state.location.href).toBe(`/members/${MEMBER.id}`);
  });

  it("이용 기록이 없으면 빈 상태 문구를 보여준다", async () => {
    fetchMemberStays.mockResolvedValue(
      createStayPage({ items: [], totalElements: 0, totalPages: 0 }),
    );
    renderMemberDetailPage();

    const section = await getStaySection();
    expect(
      await within(section).findByText(MEMBER_STAY_HISTORY_MESSAGES.empty),
    ).toBeInTheDocument();
  });

  it("불러오지 못하면 묶음 안에만 오류를 보여주고 '다시 시도'로 이용 기록만 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchMemberStays.mockRejectedValueOnce(new Error("network"));
    renderMemberDetailPage();

    const section = await getStaySection();
    expect(
      await within(section).findByText(MEMBER_STAY_HISTORY_MESSAGES.loadFailed),
    ).toBeInTheDocument();
    expect(screen.getByText(MEMBER.email)).toBeInTheDocument();

    await user.click(
      within(section).getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await within(section).findByRole("table")).toBeInTheDocument();
    expect(fetchMemberStays).toHaveBeenCalledTimes(2);
    expect(fetchMember).toHaveBeenCalledTimes(1);
  });
});
