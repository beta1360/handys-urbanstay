import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, ApiResponseError, fetchMe } from "@/shared/api";
import { COMMON_MESSAGES, ROUTES } from "@/shared/config";
import { sanitizeLoginRedirect } from "@/shared/lib/login-redirect";
import { GuestOnly } from "./guest-only";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMe: vi.fn(),
}));

const FORM_TEXT = "로그인 폼";

const replace = vi.fn();

function renderGuestOnly(redirectParam: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <GuestOnly redirectTo={sanitizeLoginRedirect(redirectParam)}>
          <p>{FORM_TEXT}</p>
        </GuestOnly>
      </QueryClientProvider>
    </StrictMode>,
  );
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ replace } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GuestOnly", () => {
  it.each([
    ["redirect가 있으면 그 주소", "/me/stays", "/me/stays"],
    ["redirect가 없으면 호텔 목록", undefined, ROUTES.hotels],
  ])(
    "회원이면 화면을 보여주지 않고 %s로 한 번만 이동한다",
    async (_, redirectParam, expected) => {
      vi.mocked(fetchMe).mockResolvedValue({
        id: 1,
        email: "guest@example.com",
        name: "김회원",
        phone: "010-1234-5678",
      });
      renderGuestOnly(redirectParam);

      await waitFor(() => expect(replace).toHaveBeenCalledWith(expected));
      expect(replace).toHaveBeenCalledOnce();
      expect(screen.queryByText(FORM_TEXT)).not.toBeInTheDocument();
      expect(screen.getByText(COMMON_MESSAGES.loading)).toBeInTheDocument();
    },
  );

  it("비회원이면 화면을 보여주고 이동하지 않는다", async () => {
    vi.mocked(fetchMe).mockRejectedValue(
      new ApiResponseError("getMe", 401, {
        code: API_ERROR_CODES.unauthorized,
        message: "로그인이 필요합니다.",
        fieldErrors: [],
      }),
    );
    renderGuestOnly("/me/stays");

    expect(await screen.findByText(FORM_TEXT)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
