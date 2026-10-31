import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEMBER_LABELS } from "@/entities/member";
import {
  API_ERROR_CODES,
  ApiResponseError,
  memberQueryKey,
  signupMember,
} from "@/shared/api";
import { COMMON_MESSAGES, FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { showToast } from "@/shared/lib/toast";
import { SignupForm } from "./signup-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  signupMember: vi.fn(),
}));

vi.mock("@/shared/lib/toast", () => ({
  showToast: vi.fn(),
}));

const REDIRECT_TO = "/hotels/3?checkInDate=2026-11-13";

const MEMBER = {
  id: 1,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
};

const PASSWORD = "password1";

const replace = vi.fn();

function renderSignupForm() {
  const queryClient = new QueryClient();
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <SignupForm redirectTo={REDIRECT_TO} />
    </QueryClientProvider>,
  );
  return { user, queryClient };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(MEMBER_LABELS.email), MEMBER.email);
  await user.type(screen.getByLabelText(MEMBER_LABELS.password), PASSWORD);
  await user.type(screen.getByLabelText(MEMBER_LABELS.name), MEMBER.name);
  await user.type(screen.getByLabelText(MEMBER_LABELS.phone), MEMBER.phone);
  await user.click(
    screen.getByRole("button", { name: COMMON_MESSAGES.signup }),
  );
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ replace } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SignupForm", () => {
  it("틀린 칸마다 서버와 같은 문구를 보여주고 첫 칸에 초점을 옮긴다", async () => {
    const { user } = renderSignupForm();

    await user.type(screen.getByLabelText(MEMBER_LABELS.email), "guest");
    await user.type(screen.getByLabelText(MEMBER_LABELS.password), "password");
    await user.type(screen.getByLabelText(MEMBER_LABELS.phone), "010-12");
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.signup }),
    );

    expect(
      await screen.findByText(FORM_VALIDATION_MESSAGES.emailFormat),
    ).toBeInTheDocument();
    expect(
      screen.getByText(FORM_VALIDATION_MESSAGES.passwordRule(8, 64)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(FORM_VALIDATION_MESSAGES.required),
    ).toBeInTheDocument();
    expect(
      screen.getByText(FORM_VALIDATION_MESSAGES.phoneFormat),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(MEMBER_LABELS.email)).toHaveFocus();
    expect(signupMember).not.toHaveBeenCalled();
  });

  it("이미 가입한 이메일이면 이메일 칸에 서버 문구를 보여주고 초점을 옮긴다", async () => {
    vi.mocked(signupMember).mockRejectedValue(
      new ApiResponseError("signup", 409, {
        code: API_ERROR_CODES.memberEmailDuplicated,
        message: "이미 가입한 이메일입니다.",
        fieldErrors: [],
      }),
    );
    const { user } = renderSignupForm();

    await fillAndSubmit(user);

    const email = screen.getByLabelText(MEMBER_LABELS.email);
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("이미 가입한 이메일입니다.")).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();
  });

  it("가입하면 로그인 상태로 두고 서버 문구를 띄운 뒤 원래 가려던 곳으로 간다", async () => {
    vi.mocked(signupMember).mockResolvedValue({
      data: MEMBER,
      message: "회원가입을 완료했습니다.",
    });
    const { user, queryClient } = renderSignupForm();

    await fillAndSubmit(user);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_TO));
    expect(signupMember).toHaveBeenCalledWith({
      email: MEMBER.email,
      password: PASSWORD,
      name: MEMBER.name,
      phone: MEMBER.phone,
    });
    expect(queryClient.getQueryData(memberQueryKey())).toEqual(MEMBER);
    expect(showToast).toHaveBeenCalledWith("회원가입을 완료했습니다.");
  });
});
