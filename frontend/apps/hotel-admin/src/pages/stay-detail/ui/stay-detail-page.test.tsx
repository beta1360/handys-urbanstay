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
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  parseStayPathParams,
  STAY_CANCELLATION_LABELS,
  STAY_FIELD_LABELS,
  STAY_LOAD_MESSAGES,
  STAY_NOT_FOUND_MESSAGES,
  stringifyStayPathParams,
} from "@/entities/stay";
import { STAY_CANCEL_MESSAGES } from "@/features/stay-cancel";
import {
  API_ERROR_CODES,
  roomQueryKey,
  stayListQueryKey,
} from "@/shared/api";
import type { Stay } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { StayDetailPage } from "./stay-detail-page";

const { fetchStay, cancelStay } = vi.hoisted(() => ({
  fetchStay: vi.fn(),
  cancelStay: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchStay: (stayId: number) => fetchStay(stayId),
    cancelStay: (stayId: number, body: unknown) => cancelStay(stayId, body),
  };
});

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const TODAY_IN_KOREA = new Date("2026-11-01T09:00:00+09:00");

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

function createApiError(
  status: number,
  code: string,
  message = "서버 문구",
  fieldErrors: { field: string; message: string }[] = [],
) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors },
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
  return { router, queryClient, user: userEvent.setup() };
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
  vi.useFakeTimers({ toFake: ["Date"], now: TODAY_IN_KOREA });
  fetchStay.mockResolvedValue(STAY);
});

afterEach(() => {
  vi.useRealTimers();
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
    fetchStay
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(STAY);
    const { user } = renderStayDetailPage();

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

const CANCEL_MESSAGE = "이용을 취소했습니다.";

const CANCELED_STAY: Stay = {
  ...STAY,
  cancellation: { ...CANCELLATION, reason: null },
};

function queryCancelGroup() {
  return screen.queryByRole("group", { name: STAY_CANCEL_MESSAGES.title });
}

function getOpenButton() {
  return screen.getByRole("button", { name: STAY_CANCEL_MESSAGES.title });
}

function getReasonField() {
  return screen.getByRole("textbox", {
    name: `${STAY_CANCELLATION_LABELS.reason} ${STAY_CANCEL_MESSAGES.optional}`,
  });
}

function getConfirmButton() {
  return screen.getByRole("button", { name: STAY_CANCEL_MESSAGES.confirm });
}

async function openCancelForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: STAY_CANCEL_MESSAGES.title }),
  );
}

describe("StayDetailPage 이용 취소", () => {
  it.each([
    ["취소하지 않았고 체크아웃 날짜가 오늘 뒤면 보여준다", STAY, true],
    [
      "체크아웃 날짜가 오늘(한국 시간)이면 끝난 이용이라 보여주지 않는다",
      { ...STAY, checkInDate: "2026-10-30", checkOutDate: "2026-11-01" },
      false,
    ],
    ["이미 취소했으면 보여주지 않는다", CANCELED_STAY, false],
  ])("이용 취소 묶음은 %s", async (_, stay, visible) => {
    fetchStay.mockResolvedValue(stay);
    renderStayDetailPage();

    await screen.findByRole("link", { name: STAY.room.name });
    expect(queryCancelGroup() !== null).toBe(visible);
  });

  it("이용 취소를 누르면 안내 문구와 사유 칸·취소 확정·닫기 버튼이 열리고, 닫으면 요청 없이 이용 취소 버튼에 초점을 돌린다", async () => {
    const { user } = renderStayDetailPage();

    await openCancelForm(user);

    expect(screen.getByText(STAY_CANCEL_MESSAGES.description)).toBeInTheDocument();
    expect(getReasonField()).toHaveFocus();
    expect(getConfirmButton()).toHaveAttribute("type", "submit");

    await user.type(getReasonField(), "고객 요청");
    await user.click(
      screen.getByRole("button", { name: STAY_CANCEL_MESSAGES.close }),
    );

    expect(getOpenButton()).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: STAY_CANCEL_MESSAGES.confirm }),
    ).not.toBeInTheDocument();
    expect(cancelStay).not.toHaveBeenCalled();
  });

  it.each([
    ["앞뒤 공백을 지운 사유를 담아", "  고객 요청으로 일정 변경  ", { reason: "고객 요청으로 일정 변경" }],
    ["사유가 비었으면 빈 본문으로", "   ", {}],
  ])("취소 확정을 누르면 %s 요청한다", async (_, reason, body) => {
    cancelStay.mockReturnValue(new Promise<never>(() => {}));
    const { user } = renderStayDetailPage();

    await openCancelForm(user);
    await user.type(getReasonField(), reason);
    await user.click(getConfirmButton());

    expect(cancelStay).toHaveBeenCalledExactlyOnceWith(STAY.id, body);
    expect(getConfirmButton()).toHaveAttribute("aria-busy", "true");
  });

  it("사유가 200자를 넘으면 사유 칸에 서버와 같은 오류를 보여주고 요청하지 않는다", async () => {
    const { user } = renderStayDetailPage();

    await openCancelForm(user);
    await user.click(getReasonField());
    await user.paste("가".repeat(201));
    await user.click(getConfirmButton());

    expect(getReasonField()).toHaveAttribute("aria-invalid", "true");
    expect(getReasonField()).toHaveAccessibleDescription(
      FORM_VALIDATION_MESSAGES.maxLength(200),
    );
    expect(cancelStay).not.toHaveBeenCalled();
  });

  it("취소에 성공하면 서버 문구 토스트를 띄우고 이용 목록·객실 캐시를 무효화한 뒤 다시 불러온 취소 정보를 보여준다", async () => {
    cancelStay.mockResolvedValue({ data: CANCELED_STAY, message: CANCEL_MESSAGE });
    fetchStay.mockResolvedValueOnce(STAY).mockResolvedValue(CANCELED_STAY);
    const { user, queryClient } = renderStayDetailPage();
    const listQueryKey = stayListQueryKey({ page: 0 });
    queryClient.setQueryData(listQueryKey, {
      items: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    });
    queryClient.setQueryData(roomQueryKey(STAY.room.id), {});

    await openCancelForm(user);
    await user.click(getConfirmButton());

    expect(
      await screen.findByRole("heading", {
        name: STAY_CANCELLATION_LABELS.title,
      }),
    ).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CANCEL_MESSAGE,
    });
    expect(queryCancelGroup()).not.toBeInTheDocument();
    expect(fetchStay).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryState(roomQueryKey(STAY.room.id))?.isInvalidated,
    ).toBe(true);
  });

  it.each([
    API_ERROR_CODES.stayAlreadyCanceled,
    API_ERROR_CODES.stayAlreadyEnded,
  ])(
    "%s 응답이면 서버 문구를 오류 토스트로 보여주고 이용을 다시 불러온다",
    async (code) => {
      cancelStay.mockRejectedValue(createApiError(409, code, "이미 처리된 이용"));
      fetchStay.mockResolvedValueOnce(STAY).mockResolvedValue(CANCELED_STAY);
      const { user } = renderStayDetailPage();

      await openCancelForm(user);
      await user.click(getConfirmButton());

      await vi.waitFor(() => {
        expect(showToast).toHaveBeenCalledExactlyOnceWith({
          type: "error",
          message: "이미 처리된 이용",
        });
      });
      expect(fetchStay).toHaveBeenCalledTimes(2);
      expect(queryCancelGroup()).not.toBeInTheDocument();
    },
  );

  it("사유 칸의 400 응답이면 서버 문구를 사유 칸에 보여주고 토스트를 띄우지 않는다", async () => {
    cancelStay.mockRejectedValue(
      createApiError(400, "INVALID_INPUT", "입력값이 올바르지 않습니다.", [
        { field: "reason", message: "200자 이하로 입력해 주세요." },
      ]),
    );
    const { user } = renderStayDetailPage();

    await openCancelForm(user);
    await user.type(getReasonField(), "사유");
    await user.click(getConfirmButton());

    await vi.waitFor(() => {
      expect(getReasonField()).toHaveAttribute("aria-invalid", "true");
    });
    expect(getReasonField()).toHaveAccessibleDescription(
      "200자 이하로 입력해 주세요.",
    );
    expect(getReasonField()).toHaveFocus();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("그 밖의 오류면 서버 문구를 오류 토스트로 보여주고 입력한 사유를 그대로 둔다", async () => {
    cancelStay.mockRejectedValue(
      createApiError(500, "INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다."),
    );
    const { user } = renderStayDetailPage();

    await openCancelForm(user);
    await user.type(getReasonField(), "사유");
    await user.click(getConfirmButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: "서버 내부 오류가 발생했습니다.",
      });
    });
    expect(getReasonField()).toHaveValue("사유");
    expect(getConfirmButton()).not.toBeDisabled();
    expect(fetchStay).toHaveBeenCalledOnce();
  });
});
