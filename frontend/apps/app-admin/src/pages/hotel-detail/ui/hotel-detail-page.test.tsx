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
  HOTEL_FIELD_LABELS,
  HOTEL_INFORMATION_MESSAGES,
  HOTEL_LOAD_MESSAGES,
  HOTEL_NOT_FOUND_MESSAGES,
  parseHotelPathParams,
  stringifyHotelPathParams,
} from "@/entities/hotel";
import {
  HOTEL_MASTER_FIELD_LABELS,
  HOTEL_MASTER_INFO_MESSAGES,
  HOTEL_MASTER_LOAD_MESSAGES,
} from "@/entities/hotel-master";
import { API_ERROR_CODES } from "@/shared/api";
import type { Hotel, HotelMaster } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HOTEL_DETAIL_ACTION_MESSAGES } from "@/widgets/hotel-detail";
import { HotelDetailPage } from "./hotel-detail-page";

const { fetchHotel, fetchHotelMaster } = vi.hoisted(() => ({
  fetchHotel: vi.fn(),
  fetchHotelMaster: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    fetchHotel: (hotelId: number) => fetchHotel(hotelId),
    fetchHotelMaster: (hotelId: number) => fetchHotelMaster(hotelId),
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

const MASTER: HotelMaster = {
  id: 7,
  loginId: "master@example.com",
  name: "홍길동",
  version: 2,
};

const MULTILINE_DESCRIPTION = "바다가 보이는 호텔입니다.\n\n조식을 제공합니다.";

const EDIT_PAGE_TEXT = "호텔 수정 화면";

const MASTER_EDIT_PAGE_TEXT = "마스터 수정 화면";

function hotelPath(hotelId: number | string) {
  return `/hotels/${hotelId}`;
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
  const hotelRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/$hotelId",
    params: {
      parse: parseHotelPathParams,
      stringify: stringifyHotelPathParams,
    },
  });
  const hotelDetailRoute = createRoute({
    getParentRoute: () => hotelRoute,
    path: "/",
    component: HotelDetailPage,
  });
  const hotelEditRoute = createRoute({
    getParentRoute: () => hotelRoute,
    path: "edit",
    component: () => <p>{EDIT_PAGE_TEXT}</p>,
  });
  const masterEditRoute = createRoute({
    getParentRoute: () => hotelRoute,
    path: "master/edit",
    component: () => <p>{MASTER_EDIT_PAGE_TEXT}</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        hotelListRoute,
        hotelRoute.addChildren([
          hotelDetailRoute,
          hotelEditRoute,
          masterEditRoute,
        ]),
      ]),
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
  return screen.getByRole("link", { name: COMMON_MESSAGES.backToList });
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    HOTEL_NOT_FOUND_MESSAGES.description,
  );
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAccessibleName(COMMON_MESSAGES.backToList);
  expect(screen.queryByRole("definition")).not.toBeInTheDocument();
}

function findMasterRegion() {
  return screen.findByRole("region", {
    name: HOTEL_MASTER_INFO_MESSAGES.legend,
  });
}

beforeEach(() => {
  fetchHotel.mockResolvedValue(HOTEL);
  fetchHotelMaster.mockReturnValue(new Promise<never>(() => {}));
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
      HOTEL_FIELD_LABELS.name,
      HOTEL_FIELD_LABELS.address,
      HOTEL_FIELD_LABELS.phone,
      HOTEL_FIELD_LABELS.description,
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
      HOTEL_INFORMATION_MESSAGES.emptyDescription,
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
      COMMON_MESSAGES.loading,
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
      screen.queryByRole("button", { name: COMMON_MESSAGES.retry }),
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
      expect(fetchHotelMaster).not.toHaveBeenCalled();
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

    const backLink = await screen.findByRole("link", {
      name: COMMON_MESSAGES.backToList,
    });
    expect(backLink).toHaveAttribute("href", "/hotels");
    expect(backLink).not.toHaveAttribute("aria-current");

    await user.click(backLink);

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
      HOTEL_LOAD_MESSAGES.loadFailed,
    );
    expect(getBackLink()).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    expect(await screen.findByText(HOTEL.name)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchHotel).toHaveBeenCalledTimes(2);
  });
});

describe("HotelDetailPage 수정 버튼", () => {
  it("호텔 정보를 보여줄 때 목록으로 링크 줄의 오른쪽 끝에 수정 버튼을 두고, 누르면 수정 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = renderHotelDetailPage();

    const editLink = await screen.findByRole("link", {
      name: HOTEL_DETAIL_ACTION_MESSAGES.edit,
    });
    expect(editLink).toHaveAttribute("href", `${hotelPath(HOTEL.id)}/edit`);
    expect(editLink.parentElement).toBe(getBackLink().parentElement);
    expect(editLink.parentElement?.lastElementChild).toBe(editLink);

    await user.click(editLink);

    expect(await screen.findByText(EDIT_PAGE_TEXT)).toBeInTheDocument();
    expect(router.state.location.href).toBe(`${hotelPath(HOTEL.id)}/edit`);
  });

  it.each([
    ["불러오는 중", "status", () => new Promise<never>(() => {})],
    [
      "불러오지 못했을 때",
      "alert",
      () => Promise.reject(createApiError(500, "INTERNAL_SERVER_ERROR")),
    ],
    [
      "찾을 수 없을 때",
      "alert",
      () => Promise.reject(createApiError(404, API_ERROR_CODES.hotelNotFound)),
    ],
  ])("%s에는 수정 버튼을 보여주지 않는다", async (_, role, fetchResult) => {
    fetchHotel.mockImplementation(fetchResult);
    renderHotelDetailPage();

    expect(await screen.findByRole(role)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: HOTEL_DETAIL_ACTION_MESSAGES.edit }),
    ).not.toBeInTheDocument();
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
      name: COMMON_MESSAGES.backToList,
    });
    expect(backLink).toHaveAttribute("href", "/hotels");
    expect(backLink).not.toHaveAttribute("aria-current");

    await user.click(backLink);

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels");
    });
  });
});

describe("HotelDetailPage 마스터 계정", () => {
  it("호텔 내용 아래 마스터 계정 묶음에 이름과 아이디를 보여준다", async () => {
    fetchHotelMaster.mockResolvedValue(MASTER);
    renderHotelDetailPage();

    const region = await findMasterRegion();
    const master = within(region);
    expect(await master.findByText(MASTER.loginId)).toBeInTheDocument();
    expect(master.getAllByRole("term").map((term) => term.textContent)).toEqual(
      [HOTEL_MASTER_FIELD_LABELS.name, HOTEL_MASTER_FIELD_LABELS.loginId],
    );
    expect(
      master.getAllByRole("definition").map((item) => item.textContent),
    ).toEqual([MASTER.name, MASTER.loginId]);
    expect(
      screen.getByText(HOTEL.address).compareDocumentPosition(region) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(fetchHotelMaster).toHaveBeenCalledExactlyOnceWith(HOTEL.id);
  });

  it("마스터 정보를 보여줄 때만 묶음에 마스터 정보 수정 버튼을 두고, 누르면 마스터 수정 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    let showMaster: (master: HotelMaster) => void = () => {};
    fetchHotelMaster.mockReturnValue(
      new Promise((resolve) => {
        showMaster = resolve;
      }),
    );
    const router = renderHotelDetailPage();
    const master = within(await findMasterRegion());
    const editName = { name: HOTEL_MASTER_INFO_MESSAGES.edit };
    expect(master.queryByRole("link", editName)).not.toBeInTheDocument();

    showMaster(MASTER);
    const editLink = await master.findByRole("link", editName);
    expect(editLink).toHaveAttribute(
      "href",
      `${hotelPath(HOTEL.id)}/master/edit`,
    );

    await user.click(editLink);

    expect(await screen.findByText(MASTER_EDIT_PAGE_TEXT)).toBeInTheDocument();
    expect(router.state.location.href).toBe(
      `${hotelPath(HOTEL.id)}/master/edit`,
    );
  });

  it("마스터 정보를 불러오는 동안 묶음 안에 불러오는 중 문구를 보여준다", async () => {
    renderHotelDetailPage();

    const region = await findMasterRegion();
    expect(within(region).getByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(screen.getByText(HOTEL.address)).toBeInTheDocument();
  });

  it("마스터 정보를 불러오지 못하면 묶음 안에 오류 문구와 다시 시도 버튼을 보여주고, 누르면 마스터만 다시 조회한다", async () => {
    const user = userEvent.setup();
    fetchHotelMaster
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(MASTER);
    renderHotelDetailPage();

    const master = within(await findMasterRegion());
    expect(await master.findByRole("alert")).toHaveTextContent(
      HOTEL_MASTER_LOAD_MESSAGES.loadFailed,
    );
    expect(screen.getByText(HOTEL.address)).toBeInTheDocument();

    await user.click(master.getByRole("button", { name: COMMON_MESSAGES.retry }));

    expect(await master.findByText(MASTER.loginId)).toBeInTheDocument();
    expect(master.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchHotelMaster).toHaveBeenCalledTimes(2);
    expect(fetchHotel).toHaveBeenCalledOnce();
  });
});
