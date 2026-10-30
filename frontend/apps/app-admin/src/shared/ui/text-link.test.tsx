import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { TextLink } from "./text-link";

const LINK_TEXT = "어반스테이 해운대";

function renderInRouter(link: ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => link,
  });
  const hotelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "hotels/$hotelId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, hotelRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    parseSearch,
    stringifySearch,
  });

  render(<RouterProvider router={router} />);
}

describe("TextLink", () => {
  it("to와 params로 만든 주소의 링크를 그린다", async () => {
    renderInRouter(
      <TextLink to="/hotels/$hotelId" params={{ hotelId: 1 }}>
        {LINK_TEXT}
      </TextLink>,
    );

    expect(
      await screen.findByRole("link", { name: LINK_TEXT }),
    ).toHaveAttribute("href", "/hotels/1");
  });

  it("className을 넘기면 글자 링크 모양에 덧붙인다", async () => {
    renderInRouter(
      <TextLink to="/hotels/$hotelId" params={{ hotelId: 1 }} className="text-sm">
        {LINK_TEXT}
      </TextLink>,
    );

    expect(
      await screen.findByRole("link", { name: LINK_TEXT }),
    ).toHaveClass("text-sm", "underline");
  });
});
