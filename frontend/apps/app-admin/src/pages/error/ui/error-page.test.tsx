import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ERROR_PAGE_MESSAGES } from "../config/messages";
import { ErrorPage } from "./error-page";

function renderErrorPage() {
  const router = createRouter({
    routeTree: createRootRoute({ component: ErrorPage }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);
  return router;
}

describe("ErrorPage", () => {
  it("화면을 불러오지 못했다는 문구와 다시 시도 버튼을 보여준다", async () => {
    renderErrorPage();

    expect(
      await screen.findByText(ERROR_PAGE_MESSAGES.description),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: ERROR_PAGE_MESSAGES.retry }),
    ).toBeInTheDocument();
  });

  it("다시 시도 버튼을 누르면 라우터를 다시 불러온다", async () => {
    const user = userEvent.setup();
    const router = renderErrorPage();
    const invalidate = vi.spyOn(router, "invalidate");

    await user.click(
      await screen.findByRole("button", { name: ERROR_PAGE_MESSAGES.retry }),
    );

    expect(invalidate).toHaveBeenCalledOnce();
  });
});
