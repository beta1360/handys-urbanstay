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
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import {
  OPERATOR_FIELD_LABELS,
  OPERATOR_INFO_MESSAGES,
  parseOperatorPathParams,
  stringifyOperatorPathParams,
} from "@/entities/operator";
import { OPERATOR_UPDATE_FORM_MESSAGES } from "@/features/operator-update";
import { API_ERROR_CODES, updateOperator } from "@/shared/api";
import type { Operator } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { OperatorEditPage } from "./operator-edit-page";

const { fetchOperator } = vi.hoisted(() => ({ fetchOperator: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchOperator: (operatorId: number) => fetchOperator(operatorId),
  updateOperator: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const OPERATOR: Operator = {
  id: 3,
  loginId: "kim@example.com",
  name: "김운영",
  active: true,
  version: 2,
};

const LATEST_OPERATOR: Operator = {
  ...OPERATOR,
  loginId: "kim.new@example.com",
  name: "김운영(변경)",
  version: 3,
};

const MODIFIED_MESSAGE = "다른 사용자가 먼저 수정했습니다.";

function createApiError(status: number, code: string, message: string) {
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

async function renderOperatorEditPage() {
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
          createRoute({ getParentRoute: () => operatorRoute, path: "/" }),
          createRoute({
            getParentRoute: () => operatorRoute,
            path: "edit",
            component: OperatorEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/operators/${OPERATOR.id}/edit`],
    }),
    parseSearch,
    stringifySearch,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole("group", { name: OPERATOR_INFO_MESSAGES.legend });
  return { user: userEvent.setup() };
}

function getFields() {
  const group = within(
    screen.getByRole("group", { name: OPERATOR_INFO_MESSAGES.legend }),
  );
  return {
    loginId: group.getByLabelText(OPERATOR_INFO_MESSAGES.loginIdLabel),
    name: group.getByLabelText(OPERATOR_FIELD_LABELS.name),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.save });
}

async function replaceName(user: UserEvent, value: string) {
  await user.clear(getFields().name);
  await user.paste(value);
}

beforeEach(() => {
  fetchOperator.mockResolvedValue(OPERATOR);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("OperatorEditPage", () => {
  it("상세 조회 값으로 아이디·이름을 채우고 아이디 칸에 세션이 끊긴다는 안내를 연결한다", async () => {
    await renderOperatorEditPage();

    const { loginId, name } = getFields();
    expect(loginId).toHaveValue(OPERATOR.loginId);
    expect(name).toHaveValue(OPERATOR.name);
    expect(loginId).toHaveAttribute("autocomplete", "off");
    expect(loginId).toHaveAccessibleDescription(
      OPERATOR_UPDATE_FORM_MESSAGES.loginIdHint,
    );
  });

  it("아이디 중복 응답이면 서버 문구를 아이디 칸 오류로 보여주고 초점을 옮긴다", async () => {
    const message = "이미 사용 중인 아이디입니다.";
    vi.mocked(updateOperator).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.loginIdDuplicated, message),
    );
    const { user } = await renderOperatorEditPage();

    await user.click(getSubmitButton());

    const { loginId } = getFields();
    await vi.waitFor(() => {
      expect(loginId).toHaveFocus();
    });
    expect(loginId).toHaveAccessibleDescription(
      expect.stringContaining(message),
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it("수정 충돌 응답이면 입력한 내용을 두고 최신 내용 불러오기 버튼을 두며, 누르면 최신 값으로 다시 채워 새 version으로 저장한다", async () => {
    vi.mocked(updateOperator).mockRejectedValueOnce(
      createApiError(409, API_ERROR_CODES.operatorModified, MODIFIED_MESSAGE),
    );
    const { user } = await renderOperatorEditPage();

    await replaceName(user, "입력한 이름");
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MODIFIED_MESSAGE,
    );
    expect(getFields().name).toHaveValue("입력한 이름");
    expect(showToast).not.toHaveBeenCalled();

    fetchOperator.mockResolvedValue(LATEST_OPERATOR);
    vi.mocked(updateOperator).mockReturnValue(new Promise<never>(() => {}));
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.reload }),
    );

    await vi.waitFor(() => {
      expect(getFields().name).toHaveValue(LATEST_OPERATOR.name);
    });
    expect(getFields().loginId).toHaveValue(LATEST_OPERATOR.loginId);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(getSubmitButton());

    expect(vi.mocked(updateOperator).mock.lastCall).toEqual([
      OPERATOR.id,
      {
        loginId: LATEST_OPERATOR.loginId,
        name: LATEST_OPERATOR.name,
        version: LATEST_OPERATOR.version,
      },
    ]);
  });
});
