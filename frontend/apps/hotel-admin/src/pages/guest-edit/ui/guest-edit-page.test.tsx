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
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast } from "@repo/admin-kit/toast";
import {
  GUEST_FIELD_LABELS,
  GUEST_INFO_FIELDS,
  GUEST_INFO_MESSAGES,
  GUEST_LOAD_MESSAGES,
  GUEST_NOT_FOUND_MESSAGES,
  parseGuestPathParams,
  stringifyGuestPathParams,
} from "@/entities/guest";
import type { GuestInfoField } from "@/entities/guest";
import { API_ERROR_CODES, guestQueryKey, updateGuest } from "@/shared/api";
import type { Guest } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { GuestEditPage } from "./guest-edit-page";

const { fetchGuest } = vi.hoisted(() => ({ fetchGuest: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    updateGuest: vi.fn(),
    fetchGuest: (guestId: number) => fetchGuest(guestId),
  };
});

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const onMutationError = vi.fn();

const UPDATE_MESSAGE = "이용객 정보를 수정했습니다.";

const GUEST_MODIFIED_MESSAGE =
  "다른 사용자가 먼저 수정했습니다. 다시 불러온 뒤 시도해 주세요.";

const DETAIL_PAGE_TEXT = "이용객 상세 화면";

const GUEST: Guest = {
  id: 3,
  name: "김이용",
  phone: "010-1234-5678",
  email: "kim@example.com",
  version: 2,
};

const LATEST_GUEST: Guest = {
  ...GUEST,
  name: "김이용(변경)",
  email: "kim.new@example.com",
  version: 3,
};

type FormValues = Record<GuestInfoField, string>;

function valuesOf({ name, phone, email }: Guest): FormValues {
  return { name, phone, email };
}

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

function renderGuestEditPage(guestId = String(GUEST.id)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({ onError: onMutationError }),
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const guestRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "guests/$guestId",
    params: {
      parse: parseGuestPathParams,
      stringify: stringifyGuestPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "guests/" }),
        guestRoute.addChildren([
          createRoute({
            getParentRoute: () => guestRoute,
            path: "/",
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => guestRoute,
            path: "edit",
            component: GuestEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/guests/${guestId}`, `/guests/${guestId}/edit`],
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
  return { router, queryClient, user: userEvent.setup() };
}

async function renderLoadedGuestEditPage() {
  const rendered = renderGuestEditPage();
  await screen.findByRole("group", { name: GUEST_INFO_MESSAGES.legend });
  return rendered;
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

function expectFormValues(values: FormValues) {
  const fields = getFields();
  for (const field of GUEST_INFO_FIELDS) {
    expect(fields[field]).toHaveValue(values[field]);
  }
}

function getSubmitButton() {
  return screen.getByRole("button", {
    name: COMMON_MESSAGES.save,
  });
}

function getReloadButton() {
  return screen.getByRole("button", {
    name: COMMON_MESSAGES.reload,
  });
}

async function replaceName(user: UserEvent, value: string) {
  await user.clear(getFields().name);
  await user.paste(value);
}

beforeEach(() => {
  fetchGuest.mockResolvedValue(GUEST);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GuestEditPage 불러오기", () => {
  it("상세 조회 값으로 폼을 채우고 아래에 저장·취소 버튼을 둔다", async () => {
    await renderLoadedGuestEditPage();

    expectFormValues(valuesOf(GUEST));
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", `/guests/${GUEST.id}`);
    expect(
      screen.queryByRole("link", { name: COMMON_MESSAGES.backToList }),
    ).not.toBeInTheDocument();
  });

  it("id가 잘못되면 요청하지 않고 찾을 수 없음을 보여준다", async () => {
    renderGuestEditPage("abc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GUEST_NOT_FOUND_MESSAGES.description,
    );
    expect(fetchGuest).not.toHaveBeenCalled();
  });
});

describe("GuestEditPage 저장", () => {
  it("바뀐 값이 없어도 처음 채운 값과 version으로 저장하고, 성공하면 서버 문구 토스트를 띄우고 상세 캐시에 넣은 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(updateGuest).mockResolvedValue({
      data: GUEST,
      message: UPDATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderLoadedGuestEditPage();

    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(updateGuest).toHaveBeenCalledExactlyOnceWith(GUEST.id, {
      ...valuesOf(GUEST),
      version: GUEST.version,
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: UPDATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/guests/${GUEST.id}`);
    expect(router.history.length).toBe(2);
    expect(queryClient.getQueryData(guestQueryKey(GUEST.id))).toEqual(GUEST);
  });

  it("전화번호 중복 응답이면 서버 문구를 전화번호 칸 오류로 보여주고 초점을 옮긴다", async () => {
    const message = "같은 전화번호의 이용객이 이미 있습니다.";
    vi.mocked(updateGuest).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.guestPhoneDuplicated, message),
    );
    const { user } = await renderLoadedGuestEditPage();

    await user.click(getSubmitButton());

    const { phone } = getFields();
    await vi.waitFor(() => {
      expect(phone).toHaveFocus();
    });
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      `${GUEST_INFO_MESSAGES.phoneHint} ${message}`,
    );
    expect(showToast).not.toHaveBeenCalled();
  });
});

describe("GuestEditPage 수정 충돌", () => {
  async function submitWithConflict(user: UserEvent) {
    vi.mocked(updateGuest).mockRejectedValueOnce(
      createApiError(
        409,
        API_ERROR_CODES.guestModified,
        GUEST_MODIFIED_MESSAGE,
      ),
    );
    await replaceName(user, "입력한 이름");
    await user.click(getSubmitButton());
    return screen.findByRole("alert");
  }

  it("다른 사용자가 먼저 수정했다는 응답이면 입력한 내용을 두고 서버 문구 알림 옆에 최신 내용 불러오기 버튼을 둔다", async () => {
    const { user } = await renderLoadedGuestEditPage();

    const alert = await submitWithConflict(user);

    expect(alert).toHaveTextContent(GUEST_MODIFIED_MESSAGE);
    expect(getReloadButton().parentElement).toBe(alert.parentElement);
    expect(showToast).not.toHaveBeenCalled();
    expectFormValues({ ...valuesOf(GUEST), name: "입력한 이름" });
  });

  it("최신 내용 불러오기를 누르면 새로 조회해 최신 값으로 폼을 다시 채우고 첫 칸에 초점을 옮긴 뒤, 저장하면 새 version을 보낸다", async () => {
    const { user } = await renderLoadedGuestEditPage();
    await submitWithConflict(user);
    fetchGuest.mockResolvedValue(LATEST_GUEST);
    vi.mocked(updateGuest).mockReturnValue(new Promise<never>(() => {}));

    await user.click(getReloadButton());

    await vi.waitFor(() => {
      expectFormValues(valuesOf(LATEST_GUEST));
    });
    expect(fetchGuest).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getFields().name).toHaveFocus();
    });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateGuest).mock.lastCall?.[1]).toEqual({
      ...valuesOf(LATEST_GUEST),
      version: LATEST_GUEST.version,
    });
  });

  it("다시 불러오지 못하면 입력한 내용을 두고 불러오기 실패 문구를 보여주며 최신 내용 불러오기 버튼에 초점을 돌린다", async () => {
    const { user } = await renderLoadedGuestEditPage();
    await submitWithConflict(user);
    let failReload: (error: unknown) => void = () => {};
    fetchGuest.mockReturnValue(
      new Promise((_, reject) => {
        failReload = reject;
      }),
    );

    await user.click(getReloadButton());
    expect(getSubmitButton()).toBeDisabled();
    await act(async () => {
      failReload(createApiError(500, "INTERNAL_SERVER_ERROR"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GUEST_LOAD_MESSAGES.loadFailed,
    );
    expect(getReloadButton()).toHaveFocus();
    expect(getSubmitButton()).not.toBeDisabled();
    expectFormValues({ ...valuesOf(GUEST), name: "입력한 이름" });
  });
});
