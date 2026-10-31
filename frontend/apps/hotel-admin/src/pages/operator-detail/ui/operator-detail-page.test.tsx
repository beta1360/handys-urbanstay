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
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  OPERATOR_ACTIVE_LABELS,
  OPERATOR_FIELD_LABELS,
  OPERATOR_NOT_FOUND_MESSAGES,
  parseOperatorPathParams,
  stringifyOperatorPathParams,
} from "@/entities/operator";
import { OPERATOR_ACTIVE_CHANGE_MESSAGES } from "@/features/operator-active-change";
import { OPERATOR_PASSWORD_RESET_MESSAGES } from "@/features/operator-password-reset";
import {
  API_ERROR_CODES,
  operatorListQueryKey,
  resetOperatorPassword,
  updateOperatorActive,
} from "@/shared/api";
import type { Operator } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { OperatorDetailPage } from "./operator-detail-page";

const { fetchOperator } = vi.hoisted(() => ({ fetchOperator: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchOperator: (operatorId: number) => fetchOperator(operatorId),
  resetOperatorPassword: vi.fn(),
  updateOperatorActive: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const SUCCESS_MESSAGE = "운영자 계정을 바꿨습니다.";

const OPERATOR: Operator = {
  id: 3,
  loginId: "kim@example.com",
  name: "김운영",
  active: true,
  version: 2,
};

function createAxiosError(status: number, code: string, message: string) {
  const config = { headers: new AxiosHeaders() };
  const data = {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors: [] },
  };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderOperatorDetailPage(operatorId: string | number = OPERATOR.id) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const operatorRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "operators/$operatorId",
    params: {
      parse: parseOperatorPathParams,
      stringify: stringifyOperatorPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "operators/" }),
        operatorRoute.addChildren([
          createRoute({
            getParentRoute: () => operatorRoute,
            path: "/",
            component: OperatorDetailPage,
          }),
          createRoute({ getParentRoute: () => operatorRoute, path: "edit" }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/operators/${operatorId}`],
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, queryClient };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("OperatorDetailPage 내용", () => {
  it("운영자의 이름·아이디·사용 여부를 항목 목록으로 보여주고 위쪽에 목록으로 링크와 수정 버튼을 둔다", async () => {
    fetchOperator.mockResolvedValue(OPERATOR);
    renderOperatorDetailPage();

    expect(await screen.findByText(OPERATOR.name)).toBeInTheDocument();
    for (const term of Object.values(OPERATOR_FIELD_LABELS)) {
      expect(screen.getByText(term)).toBeInTheDocument();
    }
    expect(screen.getByText(OPERATOR.loginId)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_ACTIVE_LABELS.active)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveAttribute("href", "/operators");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.edit }),
    ).toHaveAttribute("href", `/operators/${OPERATOR.id}/edit`);
    expect(fetchOperator).toHaveBeenCalledExactlyOnceWith(OPERATOR.id);
  });

  it("운영자가 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchOperator.mockRejectedValue(
      createAxiosError(
        404,
        API_ERROR_CODES.operatorNotFound,
        OPERATOR_NOT_FOUND_MESSAGES.description,
      ),
    );
    renderOperatorDetailPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_NOT_FOUND_MESSAGES.description,
    );
    expect(
      screen.getAllByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).toHaveLength(1);
  });

  it("id가 잘못되면 요청하지 않고 찾을 수 없음을 보여준다", async () => {
    renderOperatorDetailPage("abc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      OPERATOR_NOT_FOUND_MESSAGES.description,
    );
    expect(fetchOperator).not.toHaveBeenCalled();
  });
});

function getPasswordInput() {
  return screen.getByLabelText(OPERATOR_PASSWORD_RESET_MESSAGES.passwordLabel);
}

function getPasswordResetButton() {
  return screen.getByRole("button", {
    name: OPERATOR_PASSWORD_RESET_MESSAGES.submit,
  });
}

describe("OperatorDetailPage 비밀번호 재설정", () => {
  it("새 비밀번호 칸은 새 비밀번호 자동 완성을 쓰고, 비운 채 제출하면 칸 오류만 보여주며 요청하지 않는다", async () => {
    const user = userEvent.setup();
    fetchOperator.mockResolvedValue(OPERATOR);
    renderOperatorDetailPage();

    await screen.findByText(OPERATOR.name);
    expect(getPasswordInput()).toHaveAttribute("autocomplete", "new-password");
    await user.click(getPasswordResetButton());

    expect(getPasswordInput()).toHaveAccessibleDescription(
      expect.stringContaining(FORM_VALIDATION_MESSAGES.required),
    );
    expect(getPasswordInput()).toHaveFocus();
    expect(resetOperatorPassword).not.toHaveBeenCalled();
  });

  it("입력한 그대로의 비밀번호로 재설정하고, 성공하면 서버 문구 토스트를 띄우고 칸을 비운 뒤 상세를 다시 불러온다", async () => {
    const user = userEvent.setup();
    const password = " newpass123 ";
    fetchOperator.mockResolvedValue(OPERATOR);
    vi.mocked(resetOperatorPassword).mockResolvedValue({
      message: SUCCESS_MESSAGE,
    });
    renderOperatorDetailPage();

    await screen.findByText(OPERATOR.name);
    await user.click(getPasswordInput());
    await user.paste(password);
    await user.click(getPasswordResetButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "success",
        message: SUCCESS_MESSAGE,
      });
    });
    expect(resetOperatorPassword).toHaveBeenCalledExactlyOnceWith(
      OPERATOR.id,
      { password },
    );
    expect(getPasswordInput()).toHaveValue("");
    expect(fetchOperator).toHaveBeenCalledTimes(2);
  });
});

describe("OperatorDetailPage 사용 여부 변경", () => {
  it("비활성화를 누르면 요청 없이 로그인과 세션이 끊긴다는 확인 문구를 보여주고, 취소하면 버튼으로 돌아온다", async () => {
    const user = userEvent.setup();
    fetchOperator.mockResolvedValue(OPERATOR);
    renderOperatorDetailPage();

    await user.click(
      await screen.findByRole("button", {
        name: OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivate,
      }),
    );

    expect(
      screen.getByText(OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivateConfirm),
    ).toBeInTheDocument();
    expect(updateOperatorActive).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.cancel }),
    );

    expect(
      screen.queryByText(OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivateConfirm),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivate,
      }),
    ).toHaveFocus();
    expect(updateOperatorActive).not.toHaveBeenCalled();
  });

  it.each([
    [
      OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivate,
      true,
      OPERATOR_ACTIVE_CHANGE_MESSAGES.activate,
      OPERATOR_ACTIVE_LABELS.inactive,
    ],
    [
      OPERATOR_ACTIVE_CHANGE_MESSAGES.activate,
      false,
      OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivate,
      OPERATOR_ACTIVE_LABELS.active,
    ],
  ])(
    "%s를 확인하면 바꿀 사용 여부를 보내고, 성공하면 토스트를 띄우고 상세를 다시 불러오며 목록을 무효화한다",
    async (actionLabel, active, nextActionLabel, nextActiveLabel) => {
      const user = userEvent.setup();
      const changed = { ...OPERATOR, active: !active, version: 3 };
      fetchOperator.mockResolvedValueOnce({ ...OPERATOR, active });
      fetchOperator.mockResolvedValue(changed);
      vi.mocked(updateOperatorActive).mockResolvedValue({
        data: changed,
        message: SUCCESS_MESSAGE,
      });
      const { queryClient } = renderOperatorDetailPage();
      const listQueryKey = operatorListQueryKey({ page: 0 });
      queryClient.setQueryData(listQueryKey, {
        items: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      });

      await user.click(
        await screen.findByRole("button", { name: actionLabel }),
      );
      const [confirmButton] = screen.getAllByRole("button", {
        name: actionLabel,
      });
      await user.click(confirmButton);

      expect(
        await screen.findByRole("button", { name: nextActionLabel }),
      ).toHaveFocus();
      expect(updateOperatorActive).toHaveBeenCalledExactlyOnceWith(
        OPERATOR.id,
        { active: !active },
      );
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "success",
        message: SUCCESS_MESSAGE,
      });
      expect(screen.getByText(nextActiveLabel)).toBeInTheDocument();
      expect(fetchOperator).toHaveBeenCalledTimes(2);
      expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(
        true,
      );
    },
  );
});
