import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HOTEL_FIELD_LABELS,
  HOTEL_INFORMATION_MESSAGES,
} from "@/entities/hotel";
import type { Hotel } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HotelDetailPage } from "./hotel-detail-page";

const { fetchHotel } = vi.hoisted(() => ({ fetchHotel: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchHotel: () => fetchHotel(),
}));

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: "강남역에서 걸어서 5분 거리입니다.",
  version: 2,
};

function renderHotelDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const hotelRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotel",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        hotelRoute.addChildren([
          createRoute({
            getParentRoute: () => hotelRoute,
            path: "/",
            component: HotelDetailPage,
          }),
          createRoute({ getParentRoute: () => hotelRoute, path: "edit" }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: ["/hotel"] }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("HotelDetailPage", () => {
  it.each([
    ["소개가 있으면 소개를", HOTEL.description, HOTEL.description],
    [
      "소개가 없으면 소개 없음을",
      null,
      HOTEL_INFORMATION_MESSAGES.emptyDescription,
    ],
  ])(
    "이름·주소·대표 전화번호와 %s 보여주고 수정 화면으로 가는 수정 버튼을 둔다",
    async (_, description, descriptionText) => {
      fetchHotel.mockResolvedValue({ ...HOTEL, description });
      renderHotelDetailPage();

      const terms = await screen.findAllByRole("term");
      expect(terms.map((term) => term.textContent)).toEqual([
        HOTEL_FIELD_LABELS.name,
        HOTEL_FIELD_LABELS.address,
        HOTEL_FIELD_LABELS.phone,
        HOTEL_FIELD_LABELS.description,
      ]);
      expect(
        screen
          .getAllByRole("definition")
          .map((definition) => definition.textContent),
      ).toEqual([HOTEL.name, HOTEL.address, HOTEL.phone, descriptionText]);
      expect(
        screen.getByRole("link", { name: COMMON_MESSAGES.edit }),
      ).toHaveAttribute("href", "/hotel/edit");
      expect(fetchHotel).toHaveBeenCalledOnce();
    },
  );
});
