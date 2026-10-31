import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_FIELD_LABELS,
  GUEST_LOAD_MESSAGES,
  GUEST_NOT_FOUND_MESSAGES,
  parseGuestPathParams,
  stringifyGuestPathParams,
} from "@/entities/guest";
import { API_ERROR_CODES } from "@/shared/api";
import type { Guest } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { GuestDetailPage } from "./guest-detail-page";

const { fetchGuest } = vi.hoisted(() => ({ fetchGuest: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchGuest: (guestId: number) => fetchGuest(guestId),
  };
});

const GUEST: Guest = {
  id: 3,
  name: "김이용",
  phone: "010-1234-5678",
  email: "kim@example.com",
  version: 1,
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

function renderGuestDetailPage(guestId = String(GUEST.id)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const guestRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "guests/$guestId",
    params: {
      parse: parseGuestPathParams,
      stringify: stringifyGuestPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "guests/" }),
        guestRoute.addChildren([
          createRoute({
            getParentRoute: () => guestRoute,
            path: "/",
            component: GuestDetailPage,
          }),
          createRoute({ getParentRoute: () => guestRoute, path: "edit" }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [`/guests/${guestId}`] }),
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

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    GUEST_NOT_FOUND_MESSAGES.description,
  );
  const [backLink, ...otherLinks] = queryBackToListLinks();
  expect(otherLinks).toHaveLength(0);
  expect(backLink).toHaveAttribute("href", "/guests");
  expect(backLink).not.toHaveAttribute("aria-current");
}

beforeEach(() => {
  fetchGuest.mockResolvedValue(GUEST);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GuestDetailPage", () => {
  it("이용객의 이름·전화번호·이메일을 항목 목록으로 보여주고 위쪽에 목록으로 링크와 수정 버튼을 둔다", async () => {
    renderGuestDetailPage();

    const terms = await screen.findAllByRole("term");
    expect(terms.map((term) => term.textContent)).toEqual([
      GUEST_FIELD_LABELS.name,
      GUEST_FIELD_LABELS.phone,
      GUEST_FIELD_LABELS.email,
    ]);
    const values = screen.getAllByRole("definition");
    expect(values.map((value) => value.textContent)).toEqual([
      GUEST.name,
      GUEST.phone,
      GUEST.email,
    ]);
    const [backLink] = queryBackToListLinks();
    expect(backLink).toHaveAttribute("href", "/guests");
    expect(backLink).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.edit }),
    ).toHaveAttribute("href", `/guests/${GUEST.id}/edit`);
    expect(fetchGuest).toHaveBeenCalledExactlyOnceWith(GUEST.id);
  });

  it("처음 불러오는 동안 목록으로 링크와 불러오는 중 문구를 보여준다", async () => {
    fetchGuest.mockReturnValue(new Promise<never>(() => {}));
    renderGuestDetailPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(queryBackToListLinks()).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: COMMON_MESSAGES.edit }),
    ).not.toBeInTheDocument();
  });

  it("이용객이 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchGuest.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.guestNotFound),
    );
    renderGuestDetailPage();

    await expectNotFound();
  });

  it.each(["abc", "0", "1.5"])(
    "id가 %s면 요청하지 않고 찾을 수 없음을 보여준다",
    async (guestId) => {
      renderGuestDetailPage(guestId);

      await expectNotFound();
      expect(fetchGuest).not.toHaveBeenCalled();
    },
  );

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchGuest
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(GUEST);
    renderGuestDetailPage();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(GUEST_LOAD_MESSAGES.loadFailed);
    expect(queryBackToListLinks()).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByText(GUEST.email)).toBeInTheDocument();
    expect(fetchGuest).toHaveBeenCalledTimes(2);
  });
});
