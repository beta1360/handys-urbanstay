import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TOAST_MESSAGES } from "@/shared/config";
import { showToast } from "@/shared/lib/toast";
import { ToastProvider } from "./toast-provider";

const NEXT_PAGE_TEXT = "호텔 목록 화면";

async function renderToastProvider() {
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => <p>첫 화면</p>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "hotels",
        component: () => <p>{NEXT_PAGE_TEXT}</p>,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  await screen.findByText("첫 화면");
  return { router, user: userEvent.setup() };
}

function getRegion() {
  return screen.getByRole("region", { name: TOAST_MESSAGES.regionLabel });
}

describe("ToastProvider", () => {
  it("띄운 토스트를 알림 영역에 보여주고 화면을 옮겨도 남기며 닫으면 지운다", async () => {
    const { router, user } = await renderToastProvider();

    act(() => {
      showToast({ type: "success", message: "저장했습니다." });
    });
    await act(() => router.navigate({ to: "/hotels" }));

    expect(await screen.findByText(NEXT_PAGE_TEXT)).toBeInTheDocument();
    const toast = within(getRegion()).getByRole("status");
    expect(toast).toHaveTextContent("저장했습니다.");

    await user.click(
      within(toast).getByRole("button", { name: TOAST_MESSAGES.close }),
    );

    expect(within(getRegion()).queryByRole("status")).not.toBeInTheDocument();
  });
});
