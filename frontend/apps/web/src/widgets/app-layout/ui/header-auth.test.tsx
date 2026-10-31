import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_ERROR_CODES,
  ApiResponseError,
  fetchMe,
  logoutMember,
} from "@/shared/api";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { loginHref, signupHref } from "@/shared/lib/login-redirect";
import { showToast } from "@/shared/lib/toast";
import { APP_HEADER_MESSAGES } from "../config/messages";
import { HeaderAuth } from "./header-auth";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMe: vi.fn(),
  logoutMember: vi.fn(),
}));

vi.mock("@/shared/lib/toast", () => ({
  showToast: vi.fn(),
}));

const CURRENT_HREF = "/hotels/3?guestCount=2";

const MEMBER_NAME = "김회원";

const refresh = vi.fn();

function renderHeaderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={queryClient}>
      <HeaderAuth />
    </QueryClientProvider>,
  );
  return { user };
}

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/hotels/3");
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams({ guestCount: "2" }) as never,
  );
  vi.mocked(useRouter).mockReturnValue({ refresh } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("HeaderAuth", () => {
  it("로그인하지 않았으면 지금 주소로 돌아오는 로그인·회원가입 링크를 보여준다", async () => {
    vi.mocked(fetchMe).mockRejectedValue(
      new ApiResponseError("getMe", 401, {
        code: API_ERROR_CODES.unauthorized,
        message: "로그인이 필요합니다.",
        fieldErrors: [],
      }),
    );
    renderHeaderAuth();

    expect(
      await screen.findByRole("link", { name: COMMON_MESSAGES.login }),
    ).toHaveAttribute("href", loginHref(CURRENT_HREF));
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.signup }),
    ).toHaveAttribute("href", signupHref(CURRENT_HREF));
  });

  it("로그인했으면 이름과 내 이용 링크를 보여주고 로그아웃하면 서버 문구를 띄우고 비회원 링크로 바꿔 화면을 다시 그린다", async () => {
    vi.mocked(fetchMe).mockResolvedValue({
      id: 1,
      email: "guest@example.com",
      name: MEMBER_NAME,
      phone: "010-1234-5678",
    });
    vi.mocked(logoutMember).mockResolvedValue({ message: "로그아웃했습니다." });
    const { user } = renderHeaderAuth();

    expect(
      await screen.findByText(APP_HEADER_MESSAGES.memberName(MEMBER_NAME)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.myStays }),
    ).toHaveAttribute("href", ROUTES.myStays);
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(logoutMember).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith("로그아웃했습니다.");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.login }),
    ).toBeInTheDocument();
  });

  it("로그아웃하지 못하면 서버 오류 문구를 띄우고 회원 메뉴를 그대로 둔다", async () => {
    vi.mocked(fetchMe).mockResolvedValue({
      id: 1,
      email: "guest@example.com",
      name: MEMBER_NAME,
      phone: "010-1234-5678",
    });
    vi.mocked(logoutMember).mockRejectedValue(
      new ApiResponseError("logout", 500, {
        code: API_ERROR_CODES.internalServerError,
        message: "서버 오류가 발생했습니다.",
        fieldErrors: [],
      }),
    );
    const { user } = renderHeaderAuth();

    await user.click(await screen.findByRole("button"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("서버 오류가 발생했습니다."),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(
      screen.getByText(APP_HEADER_MESSAGES.memberName(MEMBER_NAME)),
    ).toBeInTheDocument();
  });

  it("로그아웃 오류 본문을 쓸 수 없으면 공통 오류 문구를 띄운다", async () => {
    vi.mocked(fetchMe).mockResolvedValue({
      id: 1,
      email: "guest@example.com",
      name: MEMBER_NAME,
      phone: "010-1234-5678",
    });
    vi.mocked(logoutMember).mockRejectedValue(
      new ApiResponseError("logout", 502, undefined),
    );
    const { user } = renderHeaderAuth();

    await user.click(await screen.findByRole("button"));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(COMMON_MESSAGES.requestFailed),
    );
  });
});
