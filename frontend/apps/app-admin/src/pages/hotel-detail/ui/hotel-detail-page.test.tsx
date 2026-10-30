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
import { API_ERROR_CODES } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import {
  HOTEL_DETAIL_MESSAGES,
  HOTEL_NOT_FOUND_MESSAGES,
} from "../config/messages";
import {
  parseHotelDetailParams,
  stringifyHotelDetailParams,
} from "../model/hotel-detail-params";
import { HotelDetailPage } from "./hotel-detail-page";

const { fetchHotel } = vi.hoisted(() => ({ fetchHotel: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    hotelQueryOptions: (hotelId: number) => ({
      ...actual.hotelQueryOptions(hotelId),
      queryFn: () => fetchHotel(hotelId),
    }),
  };
});

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 해운대",
  address: "부산광역시 해운대구 해운대로 456",
  phone: "051-123-4567",
  description: "바다가 보이는 호텔입니다.",
  version: 3,
};

const MULTILINE_DESCRIPTION = "바다가 보이는 호텔입니다.\n\n조식을 제공합니다.";

function hotelPath(hotelId: number | string) {
  return `/hotels/${hotelId}`;
}

function createApiError(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
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

function renderHotelDetailPage(initialEntries = [hotelPath(HOTEL.id)]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const hotelListRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/",
  });
  const hotelDetailRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/$hotelId",
    params: {
      parse: parseHotelDetailParams,
      stringify: stringifyHotelDetailParams,
    },
    component: HotelDetailPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([hotelListRoute, hotelDetailRoute]),
    ]),
    history: createMemoryHistory({
      initialEntries,
      initialIndex: initialEntries.length - 1,
    }),
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

function getTermTexts() {
  return screen.getAllByRole("term").map((term) => term.textContent);
}

function getDescriptionTexts() {
  return screen
    .getAllByRole("definition")
    .map((definition) => definition.textContent);
}

function getBackLink() {
  return screen.getByRole("link", { name: HOTEL_DETAIL_MESSAGES.backToList });
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    HOTEL_NOT_FOUND_MESSAGES.description,
  );
  expect(
    screen.getAllByRole("button", {
      name: HOTEL_NOT_FOUND_MESSAGES.backToList,
    }),
  ).toHaveLength(1);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("definition")).not.toBeInTheDocument();
}

beforeEach(() => {
  fetchHotel.mockResolvedValue(HOTEL);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("HotelDetailPage 정보", () => {
  it("호텔의 이름·주소·대표 전화번호·소개를 항목 이름과 값의 목록으로 보여주고 위쪽에 목록으로 링크를 둔다", async () => {
    renderHotelDetailPage();

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(getBackLink()).toBeInTheDocument();
    expect(getTermTexts()).toEqual([
      HOTEL_DETAIL_MESSAGES.nameLabel,
      HOTEL_DETAIL_MESSAGES.addressLabel,
      HOTEL_DETAIL_MESSAGES.phoneLabel,
      HOTEL_DETAIL_MESSAGES.descriptionLabel,
    ]);
    expect(getDescriptionTexts()).toEqual([
      HOTEL.name,
      HOTEL.address,
      HOTEL.phone,
      HOTEL.description,
    ]);
    expect(fetchHotel).toHaveBeenCalledExactlyOnceWith(HOTEL.id);
  });

  it("소개가 없으면 소개 없음을 보여준다", async () => {
    fetchHotel.mockResolvedValue({ ...HOTEL, description: null });
    renderHotelDetailPage();

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(getDescriptionTexts().at(-1)).toBe(
      HOTEL_DETAIL_MESSAGES.emptyDescription,
    );
  });

  it("여러 줄 소개는 줄바꿈을 그대로 담아 보여준다", async () => {
    fetchHotel.mockResolvedValue({
      ...HOTEL,
      description: MULTILINE_DESCRIPTION,
    });
    renderHotelDetailPage();

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(getDescriptionTexts().at(-1)).toBe(MULTILINE_DESCRIPTION);
  });

  it("처음 불러오는 동안 불러오는 중 문구와 위쪽 목록으로 링크를 보여준다", async () => {
    fetchHotel.mockReturnValue(new Promise<never>(() => {}));
    renderHotelDetailPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      HOTEL_DETAIL_MESSAGES.loading,
    );
    expect(getBackLink()).toBeInTheDocument();
    expect(screen.queryByRole("definition")).not.toBeInTheDocument();
  });
});

describe("HotelDetailPage 찾을 수 없음", () => {
  it("호텔이 없다는 404 응답이면 위쪽 목록으로 링크 없이 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchHotel.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.hotelNotFound),
    );
    renderHotelDetailPage();

    await expectNotFound();
    expect(
      screen.queryByRole("button", { name: HOTEL_DETAIL_MESSAGES.retry }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["숫자가 아니면", "abc"],
    ["0이면", "0"],
    ["음수면", "-1"],
    ["정수가 아니면", "1.5"],
    ["지수 표기면", "1e3"],
    ["안전한 정수 범위를 넘으면", "9007199254740992"],
    ["아주 큰 수면", "99999999999999999999"],
  ])(
    "id가 %s 조회하지 않고 위쪽 목록으로 링크 없이 찾을 수 없다는 문구와 목록으로 버튼만 보여준다",
    async (_, hotelId) => {
      renderHotelDetailPage([hotelPath(hotelId)]);

      await expectNotFound();
      expect(fetchHotel).not.toHaveBeenCalled();
    },
  );

  it("앞에 0이 붙은 id는 같은 숫자의 호텔로 조회한다", async () => {
    renderHotelDetailPage([hotelPath("01")]);

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(fetchHotel).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("목록으로 버튼을 누르면 검색·페이지 없이 호텔 목록으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = renderHotelDetailPage([
      "/hotels?keyword=%EA%B0%95%EB%82%A8&page=2",
      hotelPath("abc"),
    ]);

    await user.click(
      await screen.findByRole("button", {
        name: HOTEL_NOT_FOUND_MESSAGES.backToList,
      }),
    );

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels");
    });
  });
});

describe("HotelDetailPage 오류", () => {
  it("그 밖의 오류면 위쪽 목록으로 링크와 함께 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchHotel
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(HOTEL);
    renderHotelDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      HOTEL_DETAIL_MESSAGES.loadFailed,
    );
    expect(getBackLink()).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: HOTEL_DETAIL_MESSAGES.retry }),
    );

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchHotel).toHaveBeenCalledTimes(2);
  });
});

describe("HotelDetailPage 목록으로", () => {
  it("위쪽 목록으로 링크는 검색·페이지 없이 호텔 목록으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = renderHotelDetailPage([
      "/hotels?keyword=%EA%B0%95%EB%82%A8&page=2",
      hotelPath(HOTEL.id),
    ]);

    const backLink = await screen.findByRole("link", {
      name: HOTEL_DETAIL_MESSAGES.backToList,
    });
    expect(backLink).toHaveAttribute("href", "/hotels");
    expect(backLink).not.toHaveAttribute("aria-current");

    await user.click(backLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels");
    });
  });
});
