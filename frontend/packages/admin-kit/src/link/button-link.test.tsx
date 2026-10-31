import { buttonClassName } from "@repo/ui/button-class-name";
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
import { ButtonLink } from "./button-link";

const LINK_TEXT = "수정";

function renderInRouter(link: ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => link,
  });
  const hotelEditRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "hotels/$hotelId/edit",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, hotelEditRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);
}

describe("ButtonLink", () => {
  it("to와 params로 만든 주소의 링크를 그린다", async () => {
    renderInRouter(
      <ButtonLink to="/hotels/$hotelId/edit" params={{ hotelId: 1 }}>
        {LINK_TEXT}
      </ButtonLink>,
    );

    expect(
      await screen.findByRole("link", { name: LINK_TEXT }),
    ).toHaveAttribute("href", "/hotels/1/edit");
  });

  it("variant를 지정하지 않으면 primary 버튼 모양으로 보여준다", async () => {
    renderInRouter(
      <ButtonLink to="/hotels/$hotelId/edit" params={{ hotelId: 1 }}>
        {LINK_TEXT}
      </ButtonLink>,
    );

    expect(
      await screen.findByRole("link", { name: LINK_TEXT }),
    ).toHaveAttribute("class", buttonClassName("primary"));
  });

  it("className을 넘기면 버튼 모양에 덧붙인다", async () => {
    renderInRouter(
      <ButtonLink
        to="/hotels/$hotelId/edit"
        params={{ hotelId: 1 }}
        className="w-full"
      >
        {LINK_TEXT}
      </ButtonLink>,
    );

    expect(
      await screen.findByRole("link", { name: LINK_TEXT }),
    ).toHaveClass("w-full", ...buttonClassName("primary").split(" "));
  });
});
