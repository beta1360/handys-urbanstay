import { StrictMode } from "react";
import type { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { endMemberSession, startMemberSession } from "@/entities/member";
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

const MEMBER = {
  id: 1,
  email: "guest@example.com",
  name: "김회원",
  phone: "010-1234-5678",
};

const REDIRECT_TO = "/me/stays";

let hydratedRoot: Root | undefined;

function guestOnlyTree(queryClient: QueryClient): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <GuestOnly redirectTo={REDIRECT_TO}>
        <p>{FORM_TEXT}</p>
      </GuestOnly>
    </QueryClientProvider>
  );
}

function hydrateWithCachedMember(
  cacheMember: (queryClient: QueryClient) => void,
) {
  const serverHtml = renderToString(guestOnlyTree(new QueryClient()));
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);
  const clientQueryClient = new QueryClient();
  cacheMember(clientQueryClient);
  const onRecoverableError = vi.fn();
  act(() => {
    hydratedRoot = hydrateRoot(container, guestOnlyTree(clientQueryClient), {
      onRecoverableError,
    });
  });
  return { serverHtml, onRecoverableError };
}

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
  act(() => hydratedRoot?.unmount());
  hydratedRoot = undefined;
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("GuestOnly", () => {
  it.each([
    ["redirect가 있으면 그 주소", "/me/stays", "/me/stays"],
    ["redirect가 없으면 호텔 목록", undefined, ROUTES.hotels],
  ])(
    "회원이면 화면을 보여주지 않고 %s로 한 번만 이동한다",
    async (_, redirectParam, expected) => {
      vi.mocked(fetchMe).mockResolvedValue(MEMBER);
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

describe("GuestOnly 하이드레이션", () => {
  it("로그인 상태가 이미 캐시돼 있어도 첫 렌더는 서버처럼 불러오는 중이고, 비회원이면 그 뒤 화면을 보여준다", async () => {
    const { serverHtml, onRecoverableError } = hydrateWithCachedMember(
      (queryClient) => endMemberSession(queryClient),
    );

    expect(serverHtml).toContain(COMMON_MESSAGES.loading);
    expect(await screen.findByText(FORM_TEXT)).toBeInTheDocument();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("회원이 캐시돼 있으면 서버와 같은 불러오는 중을 그린 뒤 화면 없이 redirect로 이동한다", async () => {
    const { onRecoverableError } = hydrateWithCachedMember((queryClient) =>
      startMemberSession(queryClient, MEMBER),
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith(REDIRECT_TO));
    expect(screen.queryByText(FORM_TEXT)).not.toBeInTheDocument();
    expect(screen.getByText(COMMON_MESSAGES.loading)).toBeInTheDocument();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });
});
