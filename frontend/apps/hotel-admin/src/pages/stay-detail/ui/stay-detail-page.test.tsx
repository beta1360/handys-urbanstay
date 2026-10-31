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
  parseStayPathParams,
  STAY_CANCELLATION_LABELS,
  STAY_FIELD_LABELS,
  STAY_LOAD_MESSAGES,
  STAY_NOT_FOUND_MESSAGES,
  stringifyStayPathParams,
} from "@/entities/stay";
import { API_ERROR_CODES } from "@/shared/api";
import type { Stay } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { StayDetailPage } from "./stay-detail-page";

const { fetchStay } = vi.hoisted(() => ({ fetchStay: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchStay: (stayId: number) => fetchStay(stayId),
  };
});

const STAY: Stay = {
  id: 5,
  room: { id: 2, name: "101" },
  guest: { id: 3, name: "김이용", phone: "010-1234-5678" },
  checkInDate: "2026-11-30",
  checkOutDate: "2026-12-02",
  guestCount: 2,
  cancellation: null,
};

const CANCELLATION = {
  canceledAt: "2026-10-30T15:05:32.123456Z",
  canceledBy: { id: 1, name: "홍길동" },
  reason: "고객 요청으로 일정 변경",
};

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message: "서버 문구", fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderStayDetailPage(stayId = String(STAY.id)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const stayRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "stays/$stayId",
    params: {
      parse: parseStayPathParams,
      stringify: stringifyStayPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "stays/" }),
        stayRoute.addChildren([
          createRoute({
            getParentRoute: () => stayRoute,
            path: "/",
            component: StayDetailPage,
          }),
        ]),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "rooms/$roomId",
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/$guestId",
        }),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/stays/${stayId}`] }),
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

function queryBackToListLinks() {
  return screen.queryAllByRole("link", { name: COMMON_MESSAGES.backToList });
}

function getItemTexts(container: HTMLElement) {
  const terms = within(container).getAllByRole("term");
  const values = within(container).getAllByRole("definition");
  return terms.map((term, index) => [term.textContent, values[index].textContent]);
}

function queryCancellationHeading() {
  return screen.queryByRole("heading", {
    name: STAY_CANCELLATION_LABELS.title,
  });
}

beforeEach(() => {
  fetchStay.mockResolvedValue(STAY);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("StayDetailPage", () => {
  it("객실·이용객 링크, 전화번호, 기간, 박 수, 인원을 항목 목록으로 보여주고 취소하지 않은 이용에는 취소 정보가 없다", async () => {
    renderStayDetailPage();

    await screen.findByRole("link", { name: STAY.room.name });
    expect(getItemTexts(document.body)).toEqual([
      [STAY_FIELD_LABELS.room, STAY.room.name],
      [STAY_FIELD_LABELS.guest, STAY.guest.name],
      [STAY_FIELD_LABELS.guestPhone, STAY.guest.phone],
      [STAY_FIELD_LABELS.checkInDate, STAY.checkInDate],
      [STAY_FIELD_LABELS.checkOutDate, STAY.checkOutDate],
      [STAY_FIELD_LABELS.nights, "2"],
      [STAY_FIELD_LABELS.guestCount, String(STAY.guestCount)],
    ]);
    expect(
      screen.getByRole("link", { name: STAY.room.name }),
    ).toHaveAttribute("href", `/rooms/${STAY.room.id}`);
    expect(
      screen.getByRole("link", { name: STAY.guest.name }),
    ).toHaveAttribute("href", `/guests/${STAY.guest.id}`);
    const [backLink, ...otherLinks] = queryBackToListLinks();
    expect(otherLinks).toHaveLength(0);
    expect(backLink).toHaveAttribute("href", "/stays");
    expect(backLink).not.toHaveAttribute("aria-current");
    expect(queryCancellationHeading()).not.toBeInTheDocument();
    expect(fetchStay).toHaveBeenCalledExactlyOnceWith(STAY.id);
  });

  it.each([
    ["사유가 있으면 사유를", CANCELLATION.reason, CANCELLATION.reason],
    ["사유가 없으면 사유 없음을", null, STAY_CANCELLATION_LABELS.emptyReason],
  ])(
    "취소한 이용이면 취소 시각(한국 시간)·처리한 계정과 %s 취소 정보로 보여준다",
    async (_, reason, reasonText) => {
      fetchStay.mockResolvedValue({
        ...STAY,
        cancellation: { ...CANCELLATION, reason },
      });
      renderStayDetailPage();

      const heading = await screen.findByRole("heading", {
        name: STAY_CANCELLATION_LABELS.title,
      });
      const card = heading.parentElement?.parentElement as HTMLElement;
      expect(getItemTexts(card)).toEqual([
        [STAY_CANCELLATION_LABELS.canceledAt, "2026-10-31 00:05"],
        [STAY_CANCELLATION_LABELS.canceledBy, CANCELLATION.canceledBy.name],
        [STAY_CANCELLATION_LABELS.reason, reasonText],
      ]);
    },
  );

  it("이용이 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchStay.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.stayNotFound),
    );
    renderStayDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      STAY_NOT_FOUND_MESSAGES.description,
    );
    expect(queryBackToListLinks()).toHaveLength(1);
  });

  it.each(["abc", "0", "1.5"])(
    "id가 %s면 요청하지 않고 찾을 수 없음을 보여준다",
    async (stayId) => {
      renderStayDetailPage(stayId);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        STAY_NOT_FOUND_MESSAGES.description,
      );
      expect(fetchStay).not.toHaveBeenCalled();
    },
  );

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchStay
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(STAY);
    renderStayDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      STAY_LOAD_MESSAGES.loadFailed,
    );
    expect(queryBackToListLinks()).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(
      await screen.findByRole("link", { name: STAY.room.name }),
    ).toBeInTheDocument();
    expect(fetchStay).toHaveBeenCalledTimes(2);
  });
});
