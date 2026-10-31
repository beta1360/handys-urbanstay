import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiResponseError, fetchMyStays, MY_STAY_PERIOD } from "@/shared/api";
import type { MyStayPeriod } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { getMyStayPage, MY_STAY_FIRST_PAGE } from "../api/my-stays";
import type { MyStayPage } from "../api/my-stays";
import { MY_STAY_MESSAGES } from "../config/messages";
import { MyStayFeed } from "./my-stay-feed";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMyStays: vi.fn(),
}));

const PAGE_SIZE = 10;

const activeObservers = new Set<FakeIntersectionObserver>();

class FakeIntersectionObserver {
  readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe() {
    activeObservers.add(this);
  }

  disconnect() {
    activeObservers.delete(this);
  }
}

function showSentinel() {
  act(() => {
    activeObservers.forEach((observer) =>
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      ),
    );
  });
}

function stay(id: number) {
  return {
    id,
    hotel: { id: 1, name: `어반스테이 ${id}호점` },
    roomType: { id: 2, name: "스탠다드" },
    checkInDate: "2026-11-05",
    checkOutDate: "2026-11-07",
    guestCount: 2,
    roomRate: 90000,
    nights: 2,
    baseAmount: 180000,
    discountAmount: 0,
    totalAmount: 180000,
    canceledAt: null,
  };
}

function stayPage(
  firstId: number,
  count: number,
  page: number,
  totalPages: number,
) {
  return {
    items: Array.from({ length: count }, (_, index) => stay(firstId + index)),
    page,
    size: PAGE_SIZE,
    totalElements: totalPages * PAGE_SIZE,
    totalPages,
  };
}

async function firstUpcomingPage(count: number, totalPages: number) {
  vi.mocked(fetchMyStays).mockResolvedValueOnce(
    stayPage(1, count, 0, totalPages),
  );
  const page = await getMyStayPage(MY_STAY_FIRST_PAGE.upcoming);
  vi.mocked(fetchMyStays).mockClear();
  return page;
}

function requestOf(period: MyStayPeriod, page: number) {
  return [{ period, page, size: PAGE_SIZE }, expect.anything()];
}

function region(name: string) {
  return screen.getByRole("region", { name });
}

function staysIn(name: string) {
  return within(region(name)).queryAllByRole("article");
}

function renderFeed(initialPages: MyStayPage[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <MyStayFeed initialPages={initialPages} />
    </QueryClientProvider>,
  );
  return { user };
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  activeObservers.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("MyStayFeed", () => {
  it("서버가 읽은 첫 10건을 보여주고 아래에 닿기 전에는 더 불러오지 않는다", async () => {
    renderFeed([await firstUpcomingPage(PAGE_SIZE, 3)]);

    expect(staysIn(MY_STAY_MESSAGES.upcomingTitle)).toHaveLength(PAGE_SIZE);
    expect(
      screen.queryByRole("region", { name: MY_STAY_MESSAGES.pastTitle }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: MY_STAY_MESSAGES.loadMore }),
    ).toBeInTheDocument();
    expect(fetchMyStays).not.toHaveBeenCalled();
  });

  it.each([
    { trigger: "아래에 닿으면", load: async () => showSentinel() },
    {
      trigger: "더 보기를 누르면",
      load: async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(
          screen.getByRole("button", { name: MY_STAY_MESSAGES.loadMore }),
        ),
    },
  ])(
    "$trigger 불러오는 중 문구를 보여주고 지금·앞으로의 다음 10건을 이어 붙인다",
    async ({ load }) => {
      const { user } = renderFeed([await firstUpcomingPage(PAGE_SIZE, 3)]);
      const nextPage = Promise.withResolvers<ReturnType<typeof stayPage>>();
      vi.mocked(fetchMyStays).mockReturnValueOnce(nextPage.promise);

      await load(user);

      expect(await screen.findByRole("status")).toHaveTextContent(
        COMMON_MESSAGES.loading,
      );
      nextPage.resolve(stayPage(11, PAGE_SIZE, 1, 3));
      await waitFor(() =>
        expect(staysIn(MY_STAY_MESSAGES.upcomingTitle)).toHaveLength(
          PAGE_SIZE * 2,
        ),
      );
      expect(fetchMyStays).toHaveBeenCalledTimes(1);
      expect(fetchMyStays).toHaveBeenCalledWith(
        ...requestOf(MY_STAY_PERIOD.UPCOMING, 1),
      );
    },
  );

  it("지금·앞으로를 모두 불러오면 지난 이용 첫 페이지를 이어 불러와 지난 이용 구역을 보여준다", async () => {
    renderFeed([await firstUpcomingPage(3, 1)]);
    vi.mocked(fetchMyStays).mockResolvedValueOnce(
      stayPage(101, PAGE_SIZE, 0, 2),
    );

    showSentinel();

    await waitFor(() =>
      expect(staysIn(MY_STAY_MESSAGES.pastTitle)).toHaveLength(PAGE_SIZE),
    );
    expect(staysIn(MY_STAY_MESSAGES.upcomingTitle)).toHaveLength(3);
    expect(fetchMyStays).toHaveBeenCalledWith(
      ...requestOf(MY_STAY_PERIOD.PAST, 0),
    );
  });

  it("지난 이용까지 모두 불러오면 끝 문구를 보여주고 더 불러오지 않는다", async () => {
    const { user } = renderFeed([await firstUpcomingPage(3, 1)]);
    vi.mocked(fetchMyStays).mockResolvedValueOnce(stayPage(101, 4, 0, 1));

    await user.click(
      screen.getByRole("button", { name: MY_STAY_MESSAGES.loadMore }),
    );

    expect(await screen.findByText(MY_STAY_MESSAGES.end)).toBeInTheDocument();
    expect(staysIn(MY_STAY_MESSAGES.pastTitle)).toHaveLength(4);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    showSentinel();
    expect(fetchMyStays).toHaveBeenCalledTimes(1);
  });

  it("다음 페이지를 불러오지 못하면 불러온 이용을 그대로 두고 다시 시도로 다시 불러온다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = renderFeed([await firstUpcomingPage(PAGE_SIZE, 2)]);
    vi.mocked(fetchMyStays)
      .mockRejectedValueOnce(
        new ApiResponseError("getMyStays", 500, undefined),
      )
      .mockResolvedValueOnce(stayPage(11, 5, 1, 2));

    showSentinel();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MY_STAY_MESSAGES.loadMoreFailed,
    );
    expect(staysIn(MY_STAY_MESSAGES.upcomingTitle)).toHaveLength(PAGE_SIZE);

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    await waitFor(() =>
      expect(staysIn(MY_STAY_MESSAGES.upcomingTitle)).toHaveLength(
        PAGE_SIZE + 5,
      ),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMyStays).toHaveBeenNthCalledWith(
      2,
      ...requestOf(MY_STAY_PERIOD.UPCOMING, 1),
    );
  });
});
