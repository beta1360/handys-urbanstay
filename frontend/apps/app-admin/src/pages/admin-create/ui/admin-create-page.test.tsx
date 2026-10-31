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
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import { ADMIN_FIELD_LABELS } from "@/entities/admin";
import { ADMIN_CREATE_FORM_MESSAGES } from "@/features/admin-create";
import {
  adminListQueryKey,
  adminQueryKey,
  API_ERROR_CODES,
  createAdmin,
} from "@/shared/api";
import type { Admin } from "@/shared/api";
import { ACCOUNT_FORM_MESSAGES, COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { AdminCreatePage } from "./admin-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createAdmin: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const CREATE_MESSAGE = "어드민 계정을 추가했습니다.";

const DETAIL_PAGE_TEXT = "어드민 계정 상세 화면";

const ADMIN: Admin = {
  id: 7,
  loginId: "new@urbanstay.com",
  name: "새어드민",
  createdAt: "2026-10-31T01:00:00Z",
  version: 0,
};

const VALID_INPUT = {
  loginId: ADMIN.loginId,
  name: ADMIN.name,
  password: " urbanstay123 ",
};

type InputField = keyof typeof VALID_INPUT;

function createApiError(status: number, code: string, message = "서버 문구") {
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

async function renderAdminCreatePage() {
  const queryClient = new QueryClient();
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "admins/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "admins/new",
          component: AdminCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "admins/$adminId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/admins", "/admins/new"],
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
  await screen.findByLabelText(ACCOUNT_FORM_MESSAGES.loginIdLabel);
  return { router, queryClient, user: userEvent.setup() };
}

function getFields(): Record<InputField, HTMLElement> {
  return {
    loginId: screen.getByLabelText(ACCOUNT_FORM_MESSAGES.loginIdLabel),
    name: screen.getByLabelText(ADMIN_FIELD_LABELS.name),
    password: screen.getByLabelText(ACCOUNT_FORM_MESSAGES.initialPasswordLabel),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.register });
}

async function fillForm(user: UserEvent, input: Partial<typeof VALID_INPUT>) {
  const fields = getFields();
  for (const [field, value] of Object.entries({ ...VALID_INPUT, ...input })) {
    await user.clear(fields[field as InputField]);
    if (value !== "") {
      await user.click(fields[field as InputField]);
      await user.paste(value);
    }
  }
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminCreatePage 화면", () => {
  it("아이디·이름·처음 비밀번호 칸을 차례로 두고 로그인한 계정으로 자동 완성되지 않게 한다", async () => {
    await renderAdminCreatePage();

    const fields = getFields();
    expect(screen.getAllByRole("textbox")).toEqual([
      fields.loginId,
      fields.name,
    ]);
    expect(fields.loginId).toHaveAttribute("type", "email");
    expect(fields.loginId).toHaveAttribute("autocomplete", "off");
    expect(fields.loginId).toHaveAccessibleDescription(
      ADMIN_CREATE_FORM_MESSAGES.loginIdHint,
    );
    expect(fields.password).toHaveAttribute("type", "password");
    expect(fields.password).toHaveAttribute("autocomplete", "new-password");
    expect(fields.password).toHaveAccessibleDescription(
      ACCOUNT_FORM_MESSAGES.passwordHint(8, 64),
    );
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", "/admins");
  });
});

describe("AdminCreatePage 입력 검사", () => {
  it("입력 없이 제출하면 모든 칸에 필수 오류를 보여주고 아이디 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderAdminCreatePage();

    await user.click(getSubmitButton());

    expect(
      screen.getAllByText(FORM_VALIDATION_MESSAGES.required),
    ).toHaveLength(3);
    expect(getFields().loginId).toHaveFocus();
    expect(createAdmin).not.toHaveBeenCalled();
  });

  it.each<[string, InputField, string, string]>([
    [
      "아이디가 이메일 형식이 아니면",
      "loginId",
      "admin",
      FORM_VALIDATION_MESSAGES.emailFormat,
    ],
    [
      "비밀번호에 숫자가 없으면",
      "password",
      "urbanstay",
      FORM_VALIDATION_MESSAGES.passwordRule(8, 64),
    ],
    [
      "비밀번호가 8자보다 짧으면",
      "password",
      "abc123",
      FORM_VALIDATION_MESSAGES.passwordRule(8, 64),
    ],
  ])("%s 그 칸에 오류를 보여주고 요청하지 않는다", async (_, field, value, error) => {
    const { user } = await renderAdminCreatePage();

    await fillForm(user, { [field]: value });
    await user.click(getSubmitButton());

    expect(getFields()[field]).toHaveAttribute("aria-invalid", "true");
    expect(await screen.findByText(error)).toBeInTheDocument();
    expect(getFields()[field]).toHaveFocus();
    expect(createAdmin).not.toHaveBeenCalled();
  });
});

describe("AdminCreatePage 요청", () => {
  it("아이디·이름은 앞뒤 공백을 지우고 비밀번호는 입력한 그대로 보내며, 성공하면 서버 문구 토스트를 띄우고 캐시를 바꾼 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createAdmin).mockResolvedValue({
      data: ADMIN,
      message: CREATE_MESSAGE,
    });
    const { router, queryClient, user } = await renderAdminCreatePage();
    queryClient.setQueryData(adminListQueryKey({ page: 0 }), {});

    await fillForm(user, {
      loginId: `  ${ADMIN.loginId} `,
      name: ` ${ADMIN.name}  `,
    });
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(createAdmin).toHaveBeenCalledExactlyOnceWith(
      {
        loginId: ADMIN.loginId,
        name: ADMIN.name,
        password: VALID_INPUT.password,
      },
      expect.anything(),
    );
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(queryClient.getQueryData(adminQueryKey(ADMIN.id))).toEqual(ADMIN);
    expect(
      queryClient.getQueryState(adminListQueryKey({ page: 0 }))?.isInvalidated,
    ).toBe(true);
    expect(router.state.location.href).toBe(`/admins/${ADMIN.id}`);
    expect(router.history.length).toBe(2);
  });

  it("아이디가 겹친다는 응답이면 서버 문구를 아이디 칸 오류로 보여주고 초점을 옮긴다", async () => {
    const message = "이미 사용 중인 아이디입니다.";
    vi.mocked(createAdmin).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.loginIdDuplicated, message),
    );
    const { user } = await renderAdminCreatePage();

    await fillForm(user, {});
    await user.click(getSubmitButton());

    const { loginId } = getFields();
    await vi.waitFor(() => {
      expect(loginId).toHaveFocus();
    });
    expect(loginId).toHaveAccessibleDescription(
      `${ADMIN_CREATE_FORM_MESSAGES.loginIdHint} ${message}`,
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it("그 밖의 오류 응답이면 서버 문구를 오류 토스트로 보여주고 입력한 내용은 그대로 둔다", async () => {
    vi.mocked(createAdmin).mockRejectedValue(
      createApiError(500, "INTERNAL_SERVER_ERROR", "서버 오류 문구"),
    );
    const { user } = await renderAdminCreatePage();

    await fillForm(user, {});
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: "서버 오류 문구",
      });
    });
    expect(getFields().name).toHaveValue(ADMIN.name);
  });
});
