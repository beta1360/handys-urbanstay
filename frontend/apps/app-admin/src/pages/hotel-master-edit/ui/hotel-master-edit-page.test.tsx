import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { showToast } from "@repo/admin-kit/toast";
import {
  HOTEL_NOT_FOUND_MESSAGES,
  parseHotelPathParams,
  stringifyHotelPathParams,
} from "@/entities/hotel";
import {
  HOTEL_MASTER_FIELD_LABELS,
  HOTEL_MASTER_INFO_MESSAGES,
  HOTEL_MASTER_LOAD_MESSAGES,
} from "@/entities/hotel-master";
import { HOTEL_MASTER_UPDATE_FORM_MESSAGES } from "@/features/hotel-master-update";
import {
  API_ERROR_CODES,
  hotelMasterQueryKey,
  updateHotelMaster,
} from "@/shared/api";
import type { HotelMaster } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HotelMasterEditPage } from "./hotel-master-edit-page";

const { fetchHotelMaster } = vi.hoisted(() => ({
  fetchHotelMaster: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  updateHotelMaster: vi.fn(),
  fetchHotelMaster: (hotelId: number) => fetchHotelMaster(hotelId),
}));

vi.mock("@repo/admin-kit/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/admin-kit/toast")>()),
  showToast: vi.fn(),
}));

const HOTEL_ID = 1;

const DETAIL_PAGE_TEXT = "호텔 상세 화면";

const UPDATE_MESSAGE = "마스터 정보를 수정했습니다.";

const MODIFIED_MESSAGE =
  "다른 사용자가 먼저 수정했습니다. 다시 불러온 뒤 시도해 주세요.";

const MASTER: HotelMaster = {
  id: 7,
  loginId: "master@example.com",
  name: "홍길동",
  version: 2,
};

const LATEST_MASTER: HotelMaster = {
  ...MASTER,
  name: "김마스터",
  version: 3,
};

function createApiError(
  status: number,
  code: string,
  message = "서버 문구",
) {
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

function renderHotelMasterEditPage(hotelId = String(HOTEL_ID)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "_authenticated",
  });
  const hotelRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "hotels/$hotelId",
    params: {
      parse: parseHotelPathParams,
      stringify: stringifyHotelPathParams,
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute.addChildren([
        createRoute({ getParentRoute: () => layoutRoute, path: "hotels/" }),
        hotelRoute.addChildren([
          createRoute({
            getParentRoute: () => hotelRoute,
            path: "/",
            component: () => <p>{DETAIL_PAGE_TEXT}</p>,
          }),
          createRoute({
            getParentRoute: () => hotelRoute,
            path: "master/edit",
            component: HotelMasterEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/hotels/${hotelId}`, `/hotels/${hotelId}/master/edit`],
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

async function renderLoadedPage() {
  const rendered = renderHotelMasterEditPage();
  await screen.findByRole("group", { name: HOTEL_MASTER_INFO_MESSAGES.legend });
  return rendered;
}

function getFields() {
  const group = within(
    screen.getByRole("group", { name: HOTEL_MASTER_INFO_MESSAGES.legend }),
  );
  return {
    loginId: group.getByLabelText(HOTEL_MASTER_INFO_MESSAGES.loginIdLabel),
    name: group.getByLabelText(HOTEL_MASTER_FIELD_LABELS.name),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.save });
}

function getReloadButton() {
  return screen.getByRole("button", { name: COMMON_MESSAGES.reload });
}

async function replaceValue(user: UserEvent, field: HTMLElement, value: string) {
  await user.clear(field);
  if (value !== "") {
    await user.paste(value);
  }
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    HOTEL_NOT_FOUND_MESSAGES.description,
  );
  expect(
    screen.getByRole("link", { name: COMMON_MESSAGES.backToList }),
  ).toHaveAttribute("href", "/hotels");
  expect(screen.queryByRole("group")).not.toBeInTheDocument();
}

beforeEach(() => {
  fetchHotelMaster.mockResolvedValue(MASTER);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("HotelMasterEditPage 불러오기", () => {
  it("마스터 조회 값으로 아이디·이름 칸을 채우고 아이디 칸에 세션이 끊긴다는 안내를 둔다", async () => {
    await renderLoadedPage();

    const fields = getFields();
    expect(fields.loginId).toHaveValue(MASTER.loginId);
    expect(fields.name).toHaveValue(MASTER.name);
    expect(fields.loginId).toHaveAttribute("autocomplete", "off");
    expect(fields.loginId).toHaveAccessibleDescription(
      HOTEL_MASTER_UPDATE_FORM_MESSAGES.loginIdHint,
    );
    expect(
      screen.getByRole("link", { name: COMMON_MESSAGES.cancel }),
    ).toHaveAttribute("href", `/hotels/${HOTEL_ID}`);
    expect(fetchHotelMaster).toHaveBeenCalledExactlyOnceWith(HOTEL_ID);
  });

  it("처음 불러오는 동안 불러오는 중 문구만 보여준다", async () => {
    fetchHotelMaster.mockReturnValue(new Promise<never>(() => {}));
    renderHotelMasterEditPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      COMMON_MESSAGES.loading,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회해 폼을 채운다", async () => {
    fetchHotelMaster
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(MASTER);
    const { user } = renderHotelMasterEditPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      HOTEL_MASTER_LOAD_MESSAGES.loadFailed,
    );
    await user.click(
      screen.getByRole("button", { name: COMMON_MESSAGES.retry }),
    );

    await screen.findByRole("group", { name: HOTEL_MASTER_INFO_MESSAGES.legend });
    expect(getFields().loginId).toHaveValue(MASTER.loginId);
  });

  it("호텔이 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchHotelMaster.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.hotelNotFound),
    );
    renderHotelMasterEditPage();

    await expectNotFound();
  });

  it("id가 잘못되면 조회하지 않고 찾을 수 없음을 보여준다", async () => {
    renderHotelMasterEditPage("abc");

    await expectNotFound();
    expect(fetchHotelMaster).not.toHaveBeenCalled();
  });
});

describe("HotelMasterEditPage 검사", () => {
  it("칸을 비우고 저장하면 두 칸에 필수 오류를 보여주고 아이디 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderLoadedPage();
    const fields = getFields();

    await replaceValue(user, fields.loginId, "  ");
    await replaceValue(user, fields.name, "");
    await user.click(getSubmitButton());

    expect(fields.loginId).toHaveAttribute("aria-invalid", "true");
    expect(fields.name).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getAllByText(FORM_VALIDATION_MESSAGES.required),
    ).toHaveLength(2);
    expect(fields.loginId).toHaveFocus();
    expect(updateHotelMaster).not.toHaveBeenCalled();
  });

  it("아이디가 이메일 형식이 아니면 형식 오류를 보여주고 요청하지 않는다", async () => {
    const { user } = await renderLoadedPage();

    await replaceValue(user, getFields().loginId, "master");
    await user.click(getSubmitButton());

    expect(getFields().loginId).toHaveAccessibleDescription(
      `${HOTEL_MASTER_UPDATE_FORM_MESSAGES.loginIdHint} ${FORM_VALIDATION_MESSAGES.emailFormat}`,
    );
    expect(updateHotelMaster).not.toHaveBeenCalled();
  });
});

describe("HotelMasterEditPage 저장", () => {
  it("앞뒤 공백을 지운 값과 처음 채운 version으로 저장하고, 성공하면 서버 문구 토스트를 띄우고 캐시를 바꾼 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    const savedMaster = { ...MASTER, loginId: "new@example.com", version: 3 };
    vi.mocked(updateHotelMaster).mockResolvedValue({
      data: savedMaster,
      message: UPDATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderLoadedPage();

    await replaceValue(user, getFields().loginId, ` ${savedMaster.loginId} `);
    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(updateHotelMaster).toHaveBeenCalledExactlyOnceWith(HOTEL_ID, {
      loginId: savedMaster.loginId,
      name: MASTER.name,
      version: MASTER.version,
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: UPDATE_MESSAGE,
    });
    expect(queryClient.getQueryData(hotelMasterQueryKey(HOTEL_ID))).toEqual(
      savedMaster,
    );
    expect(router.state.location.href).toBe(`/hotels/${HOTEL_ID}`);
    expect(router.history.length).toBe(2);
  });

  it("아이디가 겹친다는 응답이면 서버 문구를 아이디 칸 오류로 보여주고 초점을 옮긴다", async () => {
    const message = "이미 사용 중인 아이디입니다.";
    vi.mocked(updateHotelMaster).mockRejectedValue(
      createApiError(409, API_ERROR_CODES.loginIdDuplicated, message),
    );
    const { user } = await renderLoadedPage();

    await user.click(getSubmitButton());

    const { loginId } = getFields();
    await vi.waitFor(() => {
      expect(loginId).toHaveFocus();
    });
    expect(loginId).toHaveAccessibleDescription(
      `${HOTEL_MASTER_UPDATE_FORM_MESSAGES.loginIdHint} ${message}`,
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it("그 밖의 오류 응답이면 서버 문구를 오류 토스트로 보여주고 입력한 내용은 그대로 둔다", async () => {
    vi.mocked(updateHotelMaster).mockRejectedValue(
      createApiError(500, "INTERNAL_SERVER_ERROR", "서버 오류 문구"),
    );
    const { user } = await renderLoadedPage();

    await replaceValue(user, getFields().name, "바꾼 이름");
    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: "서버 오류 문구",
      });
    });
    expect(getFields().name).toHaveValue("바꾼 이름");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("HotelMasterEditPage 수정 충돌", () => {
  it("먼저 수정됐다는 응답이면 알림과 최신 내용 불러오기 버튼을 보여주고, 누르면 최신 값과 version으로 다시 채운 뒤 새 version으로 저장한다", async () => {
    vi.mocked(updateHotelMaster)
      .mockRejectedValueOnce(
        createApiError(
          409,
          API_ERROR_CODES.hotelAdminModified,
          MODIFIED_MESSAGE,
        ),
      )
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const { user } = await renderLoadedPage();

    await replaceValue(user, getFields().name, "입력한 이름");
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      MODIFIED_MESSAGE,
    );
    expect(showToast).not.toHaveBeenCalled();
    fetchHotelMaster.mockResolvedValue(LATEST_MASTER);

    await user.click(getReloadButton());

    await vi.waitFor(() => {
      expect(getFields().name).toHaveValue(LATEST_MASTER.name);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getFields().loginId).toHaveFocus();
    });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotelMaster).mock.lastCall?.[1]).toEqual({
      loginId: LATEST_MASTER.loginId,
      name: LATEST_MASTER.name,
      version: LATEST_MASTER.version,
    });
  });
});
