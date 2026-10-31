import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, ApiResponseError, fetchMe } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { GuestOnly } from "./guest-only";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  fetchMe: vi.fn(),
}));

const REDIRECT_TO = "/me/stays";

const FORM_TEXT = "로그인 폼";

const replace = vi.fn();

function renderGuestOnly() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <GuestOnly redirectTo={REDIRECT_TO}>
        <p>{FORM_TEXT}</p>
      </GuestOnly>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ replace } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GuestOnly", () => {
  it("회원이면 화면을 보여주지 않고 redirect로 보낸다", async () => {
    vi.mocked(fetchMe).mockResolvedValue({
      id: 1,
      email: "guest@example.com",
      name: "김회원",
      phone: "010-1234-5678",
    });
    renderGuestOnly();

    await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_TO));
    expect(screen.queryByText(FORM_TEXT)).not.toBeInTheDocument();
    expect(screen.getByText(COMMON_MESSAGES.loading)).toBeInTheDocument();
  });

  it("비회원이면 화면을 보여주고 이동하지 않는다", async () => {
    vi.mocked(fetchMe).mockRejectedValue(
      new ApiResponseError("getMe", 401, {
        code: API_ERROR_CODES.unauthorized,
        message: "로그인이 필요합니다.",
        fieldErrors: [],
      }),
    );
    renderGuestOnly();

    expect(await screen.findByText(FORM_TEXT)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
