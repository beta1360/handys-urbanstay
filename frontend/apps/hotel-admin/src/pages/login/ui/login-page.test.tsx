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
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import { FORM_ALERT_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import { LOGIN_MESSAGES } from "@/features/auth-login";
import { loginAccount, meQueryKey } from "@/shared/api";
import { APP_INFO } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { LoginPage } from "./login-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  loginAccount: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const LOGIN_MESSAGE = "로그인했습니다.";

const REDIRECT_HREF = "/rooms?keyword=101&page=2";

const ACCOUNT = {
  id: 1,
  loginId: "master@urbanstay.com",
  name: "홍길동",
  role: "MASTER",
  hotel: { id: 1, name: "어반스테이 강남" },
} as const;

const OTHER_QUERY_KEY = ["rooms"];

const LOGIN_INPUT = {
  loginId: "master@urbanstay.com",
  password: " password1234 ",
} as const;

const INVALID_CREDENTIALS_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

type FieldError = { field: string; message: string };

function createErrorBody(
  code: string,
  message: string,
  fieldErrors: FieldError[] = [],
) {
  return {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors },
  };
}

function createAxiosError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: "", headers: {}, config },
  );
}

function renderLoginPage() {
  const queryClient = new QueryClient();
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: "login",
        component: LoginPage,
      }),
      createRoute({ getParentRoute: () => rootRoute, path: "rooms" }),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/login?redirect=${encodeURIComponent(REDIRECT_HREF)}`],
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

function findLoginIdInput() {
  return screen.findByLabelText(LOGIN_MESSAGES.loginIdLabel);
}

function getPasswordInput() {
  return screen.getByLabelText(LOGIN_MESSAGES.passwordLabel);
}

function getSubmitButton() {
  return screen.getByRole("button", { name: LOGIN_MESSAGES.submit });
}

async function fillLoginForm(user: UserEvent) {
  await user.type(await findLoginIdInput(), LOGIN_INPUT.loginId);
  await user.type(getPasswordInput(), LOGIN_INPUT.password);
}

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("앱 이름을 제목으로, 이메일 아이디와 가려진 비밀번호 입력창을 자동 완성과 함께 보여준다", async () => {
    renderLoginPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: APP_INFO.name }),
    ).toBeInTheDocument();
    const loginIdInput = await findLoginIdInput();
    expect(loginIdInput).toHaveAttribute("type", "email");
    expect(loginIdInput).toHaveAttribute("autocomplete", "username");
    expect(getPasswordInput()).toHaveAttribute("type", "password");
    expect(getPasswordInput()).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it("아이디와 비밀번호가 비어 있으면 각 입력창에 오류를 보여주고 첫 입력창에 초점을 옮기며 요청하지 않는다", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(await findLoginIdInput(), "   ");
    await user.click(getSubmitButton());

    expect(
      screen.getByText(LOGIN_MESSAGES.loginIdRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(LOGIN_MESSAGES.passwordRequired),
    ).toBeInTheDocument();
    expect(await findLoginIdInput()).toHaveFocus();
    expect(loginAccount).not.toHaveBeenCalled();
  });
});

describe("LoginPage 제출", () => {
  it("로그인 요청 중에는 버튼이 로딩 상태이고 다시 제출해도 요청하지 않는다", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAccount).mockReturnValue(new Promise<never>(() => {}));
    renderLoginPage();

    await fillLoginForm(user);
    await user.keyboard("{Enter}");

    expect(getSubmitButton()).toHaveAttribute("aria-busy", "true");
    await user.click(getSubmitButton());
    expect(loginAccount).toHaveBeenCalledExactlyOnceWith(LOGIN_INPUT);
  });

  it("로그인에 성공하면 캐시를 비우고 내 정보를 넣은 뒤 서버의 성공 문구를 토스트로 띄우고 redirect 경로로 이동한다", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAccount).mockResolvedValue({
      data: ACCOUNT,
      message: LOGIN_MESSAGE,
    });
    const { router, queryClient } = renderLoginPage();
    queryClient.setQueryData(OTHER_QUERY_KEY, ["이전 계정의 데이터"]);

    await fillLoginForm(user);
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe(REDIRECT_HREF);
    });
    expect(queryClient.getQueryData(OTHER_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(meQueryKey())).toEqual(ACCOUNT);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: LOGIN_MESSAGE,
    });
  });
});

describe("LoginPage 서버 오류 처리", () => {
  it("입력 오류 응답의 필드 오류를 입력창에 보여준다", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAccount).mockRejectedValue(
      createAxiosError(
        400,
        createErrorBody("INVALID_INPUT", "입력값이 올바르지 않습니다.", [
          { field: "loginId", message: "아이디 서버 오류" },
        ]),
      ),
    );
    renderLoginPage();

    await fillLoginForm(user);
    await user.click(getSubmitButton());

    expect(await screen.findByText("아이디 서버 오류")).toBeInTheDocument();
    expect(await findLoginIdInput()).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    [
      "아이디·비밀번호 불일치나 비활성 계정(401)",
      401,
      createErrorBody("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE),
    ],
    [
      "서버 오류",
      500,
      createErrorBody("INTERNAL_SERVER_ERROR", "서버에서 오류가 발생했습니다."),
    ],
  ])(
    "%s 응답이면 서버 문구를 토스트가 아닌 폼 안 알림으로 보여준다",
    async (_, status, body) => {
      const user = userEvent.setup();
      vi.mocked(loginAccount).mockRejectedValue(createAxiosError(status, body));
      renderLoginPage();

      await fillLoginForm(user);
      await user.click(getSubmitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        body.error.message,
      );
      expect(getSubmitButton()).not.toBeDisabled();
      expect(showToast).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["네트워크 오류", new AxiosError("Network Error", AxiosError.ERR_NETWORK)],
    ["요청 검증 오류", new RequestValidationError("login", [])],
    ["응답 검증 오류", new ResponseValidationError("login", [])],
    ["형식이 다른 오류 응답", createAxiosError(502, "<html>Bad Gateway</html>")],
  ])("%s면 일반 오류 문구를 알림으로 보여준다", async (_, error) => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(loginAccount).mockRejectedValue(error);
    renderLoginPage();

    await fillLoginForm(user);
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      FORM_ALERT_MESSAGES.requestFailed,
    );
  });
});
