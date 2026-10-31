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
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  OPERATOR_FIELD_LABELS,
  OPERATOR_INFO_MESSAGES,
  OPERATOR_PASSWORD_LENGTH,
} from "@/entities/operator";
import { OPERATOR_CREATE_FORM_MESSAGES } from "@/features/operator-create";
import {
  API_ERROR_CODES,
  createOperator,
  operatorListQueryKey,
  operatorQueryKey,
} from "@/shared/api";
import type { Operator } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { OperatorCreatePage } from "./operator-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createOperator: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const CREATE_MESSAGE = "운영자를 등록했습니다.";

const DETAIL_PAGE_TEXT = "운영자 상세 화면";

const PASSWORD = " operator123 ";

const OPERATOR: Operator = {
  id: 9,
  loginId: "new@example.com",
  name: "박운영",
  active: true,
  version: 0,
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

async function renderOperatorCreatePage() {
  const queryClient = new QueryClient();
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "operators/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "operators/new",
          component: OperatorCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "operators/$operatorId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/operators", "/operators/new"],
      initialIndex: 1,
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
  return { router, queryClient, user: userEvent.setup() };
}

function getFields() {
  const group = within(
    screen.getByRole("group", { name: OPERATOR_INFO_MESSAGES.legend }),
  );
  return {
    loginId: group.getByLabelText(OPERATOR_INFO_MESSAGES.loginIdLabel),
    name: group.getByLabelText(OPERATOR_FIELD_LABELS.name),
    password: group.getByLabelText(OPERATOR_CREATE_FORM_MESSAGES.passwordLabel),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.register });
}

async function fillForm(
  user: UserEvent,
  input: Partial<Record<"loginId" | "name" | "password", string>> = {},
) {
  const values = {
    loginId: ` ${OPERATOR.loginId} `,
    name: OPERATOR.name,
    password: PASSWORD,
    ...input,
  };
  const fields = getFields();
  for (const [field, value] of Object.entries(values)) {
    if (value !== "") {
      await user.click(fields[field as keyof typeof values]);
      await user.paste(value);
    }
  }
}

const PASSWORD_RULE = FORM_VALIDATION_MESSAGES.passwordRule(
  OPERATOR_PASSWORD_LENGTH.min,
  OPERATOR_PASSWORD_LENGTH.max,
);

afterEach(() => {
  vi.resetAllMocks();
});

describe("OperatorCreatePage", () => {
  it("다른 사람의 계정 칸이라 아이디는 자동 완성을 끄고 비밀번호는 새 비밀번호로 둔다", async () => {
    await renderOperatorCreatePage();

    const { loginId, password } = getFields();
    expect(loginId).toHaveAttribute("autocomplete", "off");
    expect(loginId).toHaveAttribute("type", "email");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAttribute("type", "password");
  });

  it.each([
    ["입력 없이 제출하면", { loginId: "", name: "", password: "" }, "loginId", FORM_VALIDATION_MESSAGES.required],
    ["아이디가 이메일 형식이 아니면", { loginId: "operator" }, "loginId", FORM_VALIDATION_MESSAGES.emailFormat],
    ["비밀번호에 숫자가 없으면", { password: "operatorpw" }, "password", PASSWORD_RULE],
  ] as const)(
    "%s 첫 번째로 틀린 칸에 오류를 보여주고 초점을 옮기며 요청하지 않는다",
    async (_, input, field, message) => {
      const { user } = await renderOperatorCreatePage();

      await fillForm(user, input);
      await user.click(getSubmitButton());

      const target = getFields()[field];
      expect(target).toHaveAccessibleDescription(
        expect.stringContaining(message),
      );
      expect(target).toHaveFocus();
      expect(createOperator).not.toHaveBeenCalled();
    },
  );

  it("아이디 중복 응답이면 서버 문구를 아이디 칸 오류로 보여주고 초점을 옮기며 토스트를 띄우지 않는다", async () => {
    const message = "이미 사용 중인 아이디입니다.";
    vi.mocked(createOperator).mockRejectedValue(
      createAxiosError(409, API_ERROR_CODES.loginIdDuplicated, message),
    );
    const { user } = await renderOperatorCreatePage();

    await fillForm(user);
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

  it("앞뒤 공백을 지운 아이디와 입력한 그대로의 비밀번호로 등록하고, 성공하면 토스트를 띄우고 캐시를 갱신한 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createOperator).mockResolvedValue({
      data: OPERATOR,
      message: CREATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderOperatorCreatePage();
    const listQueryKey = operatorListQueryKey({ page: 0 });
    queryClient.setQueryData(listQueryKey, {
      items: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    });

    await fillForm(user);
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(vi.mocked(createOperator).mock.lastCall?.[0]).toEqual({
      loginId: OPERATOR.loginId,
      name: OPERATOR.name,
      password: PASSWORD,
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/operators/${OPERATOR.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(operatorQueryKey(OPERATOR.id))).toEqual(
      OPERATOR,
    );
  });
});
