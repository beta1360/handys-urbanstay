import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_INFO } from "@/shared/config";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";
import { AdminLayout } from "./admin-layout";

const TEST_ROUTE_TITLES = {
  home: "대시보드",
  hotels: "호텔 목록",
  hotelCreate: "호텔 등록",
} as const;

function renderAdminLayout(initialPath: string) {
  const rootRoute = createRootRoute({ component: AdminLayout });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    staticData: { title: TEST_ROUTE_TITLES.home },
  });
  const hotelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "hotels",
    staticData: { title: TEST_ROUTE_TITLES.hotels },
  });
  const hotelCreateRoute = createRoute({
    getParentRoute: () => hotelsRoute,
    path: "new",
    staticData: { title: TEST_ROUTE_TITLES.hotelCreate },
  });
  const untitledRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "untitled",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      homeRoute,
      hotelsRoute.addChildren([hotelCreateRoute]),
      untitledRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(<RouterProvider router={router} />);
}

describe("AdminLayout", () => {
  it("사이드바에 앱 이름과 메뉴 내비게이션을 보여준다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("navigation", {
        name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(APP_INFO.name)).toBeInTheDocument();
  });

  it("/ 경로에서는 홈 메뉴를 현재 페이지로 표시한다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.homeMenuLabel,
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("다른 경로에서는 홈 메뉴를 현재 페이지로 표시하지 않는다", async () => {
    renderAdminLayout("/hotels");

    expect(
      await screen.findByRole("link", {
        name: ADMIN_LAYOUT_MESSAGES.homeMenuLabel,
      }),
    ).not.toHaveAttribute("aria-current");
  });

  it("현재 화면 라우트의 제목을 위쪽 제목으로 보여준다", async () => {
    renderAdminLayout("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: TEST_ROUTE_TITLES.home,
      }),
    ).toBeInTheDocument();
  });

  it("중첩된 라우트에 모두 제목이 있으면 가장 안쪽 라우트의 제목을 보여준다", async () => {
    renderAdminLayout("/hotels/new");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: TEST_ROUTE_TITLES.hotelCreate,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: TEST_ROUTE_TITLES.hotels }),
    ).not.toBeInTheDocument();
  });

  it("일치한 라우트에 제목이 없으면 위쪽 제목을 보여주지 않는다", async () => {
    renderAdminLayout("/untitled");

    await screen.findByRole("navigation", {
      name: ADMIN_LAYOUT_MESSAGES.sidebarLabel,
    });
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});
