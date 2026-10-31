import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
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
import {
  FORM_ALERT_MESSAGES,
  FORM_VALIDATION_MESSAGES,
} from "@repo/admin-kit/config";
import { dismissToast, showToast } from "@repo/admin-kit/toast";
import {
  GUEST_FIELD_LABELS,
  GUEST_INFO_FIELDS,
  GUEST_INFO_MESSAGES,
} from "@/entities/guest";
import type { GuestInfoField } from "@/entities/guest";
import { GUEST_CREATE_FORM_MESSAGES } from "@/features/guest-create";
import {
  API_ERROR_CODES,
  createGuest,
  guestListQueryKey,
  guestQueryKey,
} from "@/shared/api";
import type { Guest, GuestPage } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { GuestCreatePage } from "./guest-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createGuest: vi.fn(),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const onMutationError = vi.fn();

const CREATE_MESSAGE = "이용객을 등록했습니다.";

const DETAIL_PAGE_TEXT = "이용객 상세 화면";

const GUEST: Guest = {
  id: 7,
  name: "김이용",
  phone: "010-1234-5678",
  email: "kim@example.com",
  version: 0,
};

const VALID_INPUT: Record<GuestInfoField, string> = {
  name: GUEST.name,
  phone: GUEST.phone,
  email: GUEST.email,
};

const FIELD_HINTS: Partial<Record<GuestInfoField, string>> = {
  phone: GUEST_INFO_MESSAGES.phoneHint,
  email: GUEST_INFO_MESSAGES.emailHint,
};

function describedText(field: GuestInfoField, error?: string) {
  return [FIELD_HINTS[field], error].filter(Boolean).join(" ");
}

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

async function renderGuestCreatePage() {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "guests/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/new",
          component: GuestCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "guests/$guestId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/guests", "/guests/new"],
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
  await screen.findByRole("group", { name: GUEST_INFO_MESSAGES.legend });
  return { router, queryClient, user: userEvent.setup() };
}

function getFields(): Record<GuestInfoField, HTMLElement> {
  const group = within(
    screen.getByRole("group", { name: GUEST_INFO_MESSAGES.legend }),
  );
  return {
    name: group.getByLabelText(GUEST_FIELD_LABELS.name),
    phone: group.getByLabelText(GUEST_FIELD_LABELS.phone),
    email: group.getByLabelText(GUEST_FIELD_LABELS.email),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", {
    name: GUEST_CREATE_FORM_MESSAGES.submit,
  });
}

function getInvalidFields() {
  return Object.values(getFields()).filter(
    (field) => field.getAttribute("aria-invalid") === "true",
  );
}

async function fillForm(
  user: UserEvent,
  input: Partial<Record<GuestInfoField, string>> = {},
) {
  const values = { ...VALID_INPUT, ...input };
  const fields = getFields();
  for (const field of GUEST_INFO_FIELDS) {
    if (values[field] !== "") {
      await user.click(fields[field]);
      await user.paste(values[field]);
    }
  }
}

async function submitValidForm(user: UserEvent) {
  await fillForm(user);
  await user.click(getSubmitButton());
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("GuestCreatePage 화면", () => {
  it("이용객 정보 묶음에 이름·전화번호·이메일 칸을 두고, 형식이 있는 칸에 안내 문구를 연결한다", async () => {
    await renderGuestCreatePage();

    const fields = getFields();
    expect(fields.name).toHaveAccessibleDescription("");
    expect(fields.phone).toHaveAccessibleDescription(describedText("phone"));
    expect(fields.email).toHaveAccessibleDescription(describedText("email"));
    expect(fields.email).toHaveAttribute("type", "email");
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", "/guests");
  });
});

describe("GuestCreatePage 입력 검사", () => {
  it("입력 없이 제출하면 모든 칸에 필수 오류를 보여주고 첫 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderGuestCreatePage();

    await fillForm(user, { name: "   ", phone: "", email: "" });
    await user.click(getSubmitButton());

    const fields = getFields();
    for (const field of GUEST_INFO_FIELDS) {
      expect(fields[field]).toHaveAccessibleDescription(
        describedText(field, FORM_VALIDATION_MESSAGES.required),
      );
    }
    expect(getInvalidFields()).toHaveLength(GUEST_INFO_FIELDS.length);
    expect(fields.name).toHaveFocus();
    expect(createGuest).not.toHaveBeenCalled();
  });

  const { maxLength, phoneFormat, emailFormat } = FORM_VALIDATION_MESSAGES;
  const LONG_EMAIL = `${"a".repeat(245)}@urbanstay.com`;

  it.each<[string, GuestInfoField, string, string]>([
    ["이름이 50자를 넘으면", "name", "가".repeat(51), maxLength(50)],
    ["전화번호에 숫자와 - 외의 글자가 있으면", "phone", "010-1234-567a", phoneFormat],
    ["전화번호의 숫자가 8개보다 적으면", "phone", "010-123", phoneFormat],
    ["형식이 맞는 전화번호가 20자를 넘으면", "phone", "010-1234-5678--------", maxLength(20)],
    ["이메일 형식이 아니면", "email", "guest", emailFormat],
    ["이메일 형식이 아니면 길어도", "email", "a".repeat(255), emailFormat],
    ["형식이 맞는 이메일이 254자를 넘으면", "email", LONG_EMAIL, maxLength(254)],
  ])(
    "%s 그 칸에 오류 하나만 보여주고 초점을 옮기며 요청하지 않는다",
    async (_, field, value, message) => {
      const { user } = await renderGuestCreatePage();

      await fillForm(user, { [field]: value });
      await user.click(getSubmitButton());

      const input = getFields()[field];
      expect(getInvalidFields()).toEqual([input]);
      expect(input).toHaveAccessibleDescription(describedText(field, message));
      expect(input).toHaveFocus();
      expect(createGuest).not.toHaveBeenCalled();
    },
  );

  it("입력창을 고치면 그 입력창의 오류만 지운다", async () => {
    const { user } = await renderGuestCreatePage();

    await user.click(getSubmitButton());
    await user.type(getFields().name, "a");

    expect(getInvalidFields()).toEqual([getFields().phone, getFields().email]);
  });
});

describe("GuestCreatePage 요청", () => {
  it("앞뒤 공백을 지운 값으로 요청하고 요청 중에는 다시 제출해도 요청하지 않는다", async () => {
    vi.mocked(createGuest).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderGuestCreatePage();

    await fillForm(user, {
      name: `  ${GUEST.name}  `,
      phone: ` ${GUEST.phone} `,
      email: GUEST.email,
    });
    await user.click(getSubmitButton());
    await user.click(getFields().name);
    await user.keyboard("{Enter}");

    expect(createGuest).toHaveBeenCalledOnce();
    expect(vi.mocked(createGuest).mock.lastCall?.[0]).toEqual(VALID_INPUT);
    expect(getSubmitButton()).toHaveAttribute("aria-busy", "true");
  });

  it("등록에 성공하면 서버의 성공 문구를 토스트로 띄우고 목록 캐시를 무효화하고 상세 캐시에 넣은 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createGuest).mockResolvedValue({
      data: GUEST,
      message: CREATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderGuestCreatePage();
    const listQueryKey = guestListQueryKey({ page: 0 });
    const emptyPage: GuestPage = {
      items: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    };
    queryClient.setQueryData(listQueryKey, emptyPage);

    await submitValidForm(user);

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/guests/${GUEST.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(guestQueryKey(GUEST.id))).toEqual(GUEST);
  });
});

describe("GuestCreatePage 서버 오류 처리", () => {
  it("전화번호 중복 응답이면 서버 문구를 전화번호 칸 오류로 보여주고 초점을 옮기며 토스트를 띄우지 않는다", async () => {
    const message = "같은 전화번호의 이용객이 이미 있습니다.";
    vi.mocked(createGuest).mockRejectedValue(
      createAxiosError(409, API_ERROR_CODES.guestPhoneDuplicated, message),
    );
    const { user } = await renderGuestCreatePage();

    await submitValidForm(user);

    const { phone } = getFields();
    await vi.waitFor(() => {
      expect(phone).toHaveFocus();
    });
    expect(getInvalidFields()).toEqual([phone]);
    expect(phone).toHaveAccessibleDescription(describedText("phone", message));
    expect(showToast).not.toHaveBeenCalled();
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it.each([
    [
      "서버 오류 응답이면 서버 문구를",
      createAxiosError(500, "INTERNAL_SERVER_ERROR", "서버 내부 오류입니다."),
      "서버 내부 오류입니다.",
    ],
    [
      "본문을 쓸 수 없는 오류면 일반 오류 문구를",
      new Error("Network Error"),
      FORM_ALERT_MESSAGES.requestFailed,
    ],
  ])(
    "%s 오류 토스트로 보여주고, 다시 제출하면 그 토스트를 지운다",
    async (_, error, message) => {
      vi.mocked(createGuest).mockRejectedValue(error);
      vi.mocked(showToast).mockReturnValue(11);
      const { user } = await renderGuestCreatePage();

      await submitValidForm(user);

      await vi.waitFor(() => {
        expect(showToast).toHaveBeenCalledExactlyOnceWith({
          type: "error",
          message,
        });
      });
      expect(getInvalidFields()).toEqual([]);

      await user.click(getSubmitButton());

      expect(dismissToast).toHaveBeenCalledWith(11);
    },
  );
});
