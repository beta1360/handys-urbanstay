import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEMBER_LABELS } from "@/entities/member";
import {
  API_ERROR_CODES,
  ApiResponseError,
  loginMember,
  memberQueryKey,
} from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { showToast } from "@/shared/lib/toast";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  loginMember: vi.fn(),
}));

vi.mock("@/shared/lib/toast", () => ({
  showToast: vi.fn(),
}));

const REDIRECT_TO = "/me/stays";

const MEMBER = {
  id: 1,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
};

const replace = vi.fn();

function renderLoginForm() {
  const queryClient = new QueryClient();
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm redirectTo={REDIRECT_TO} />
    </QueryClientProvider>,
  );
  return { user, queryClient };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(MEMBER_LABELS.email), MEMBER.email);
  await user.type(screen.getByLabelText(MEMBER_LABELS.password), "password1");
  await user.click(screen.getByRole("button", { name: COMMON_MESSAGES.login }));
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ replace } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("이메일이나 비밀번호가 틀리면 폼 알림에 서버 문구를 보여준다", async () => {
    vi.mocked(loginMember).mockRejectedValue(
      new ApiResponseError("login", 401, {
        code: API_ERROR_CODES.invalidCredentials,
        message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        fieldErrors: [],
      }),
    );
    const { user } = renderLoginForm();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "아이디 또는 비밀번호가 올바르지 않습니다.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("로그인하면 로그인 상태로 두고 서버 문구를 띄운 뒤 원래 가려던 곳으로 간다", async () => {
    vi.mocked(loginMember).mockResolvedValue({
      data: MEMBER,
      message: "로그인했습니다.",
    });
    const { user, queryClient } = renderLoginForm();

    await fillAndSubmit(user);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_TO));
    expect(queryClient.getQueryData(memberQueryKey())).toEqual(MEMBER);
    expect(showToast).toHaveBeenCalledWith("로그인했습니다.");
  });
});
