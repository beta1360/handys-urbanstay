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
import {
  HOTEL_LOAD_MESSAGES,
  HOTEL_NOT_FOUND_MESSAGES,
  parseHotelPathParams,
  stringifyHotelPathParams,
} from "@/entities/hotel";
import {
  HOTEL_INFO_FIELDS,
  HOTEL_INFO_MESSAGES,
} from "@/features/hotel-info-form";
import type { HotelInfoField } from "@/features/hotel-info-form";
import {
  API_ERROR_CODES,
  hotelListQueryKey,
  hotelQueryKey,
  updateHotel,
} from "@/shared/api";
import type { Hotel, HotelPage } from "@/shared/api";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { HOTEL_EDIT_MESSAGES } from "../config/messages";
import { HotelEditPage } from "./hotel-edit-page";

const { fetchHotel } = vi.hoisted(() => ({ fetchHotel: vi.fn() }));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return {
    ...actual,
    updateHotel: vi.fn(),
    fetchHotel: (hotelId: number) => fetchHotel(hotelId),
  };
});

const onMutationError = vi.fn();

const DETAIL_PAGE_TEXT = "호텔 상세 화면";

const HOTEL: Hotel = {
  id: 1,
  name: "어반스테이 해운대",
  address: "부산광역시 해운대구 해운대로 456",
  phone: "051-123-4567",
  description: "바다가 보이는 호텔입니다.",
  version: 3,
};

const LATEST_HOTEL: Hotel = {
  ...HOTEL,
  name: "어반스테이 해운대 오션",
  description: null,
  version: 4,
};

const EMPTY_HOTEL_PAGE: HotelPage = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

type FormValues = Record<HotelInfoField, string>;

function valuesOf(hotel: Hotel): FormValues {
  return {
    name: hotel.name,
    address: hotel.address,
    phone: hotel.phone,
    description: hotel.description ?? "",
  };
}

function hotelPath(hotelId: number | string) {
  return `/hotels/${hotelId}`;
}

function editPath(hotelId: number | string) {
  return `${hotelPath(hotelId)}/edit`;
}

type FieldError = { field: string; message: string };

function createErrorBody(
  code: string,
  message: string,
  fieldErrors: FieldError[] = [],
) {
  return { success: false, data: null, error: { code, message, fieldErrors } };
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

function createApiError(status: number, code: string, message = "서버 문구") {
  return createAxiosError(status, createErrorBody(code, message));
}

const HOTEL_MODIFIED_MESSAGE =
  "다른 사용자가 먼저 수정했습니다. 다시 불러온 뒤 시도해 주세요.";

function renderHotelEditPage({
  hotelId = String(HOTEL.id),
  cachedHotel,
}: { hotelId?: string; cachedHotel?: Hotel } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({ onError: onMutationError }),
  });
  if (cachedHotel !== undefined) {
    queryClient.setQueryData(hotelQueryKey(cachedHotel.id), cachedHotel);
  }
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
            path: "edit",
            component: HotelEditPage,
          }),
        ]),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: [hotelPath(hotelId), editPath(hotelId)],
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

async function renderLoadedHotelEditPage() {
  const rendered = renderHotelEditPage();
  await screen.findByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
  return rendered;
}

function getHotelInfoGroup() {
  return screen.getByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
}

function getFields(): Record<HotelInfoField, HTMLElement> {
  const group = within(getHotelInfoGroup());
  return {
    name: group.getByLabelText(HOTEL_INFO_MESSAGES.nameLabel),
    address: group.getByLabelText(HOTEL_INFO_MESSAGES.addressLabel),
    phone: group.getByLabelText(HOTEL_INFO_MESSAGES.phoneLabel),
    description: group.getByLabelText(
      `${HOTEL_INFO_MESSAGES.descriptionLabel} ${HOTEL_INFO_MESSAGES.optional}`,
    ),
  };
}

function expectFormValues(values: FormValues) {
  const fields = getFields();
  for (const field of HOTEL_INFO_FIELDS) {
    expect(fields[field]).toHaveValue(values[field]);
  }
}

function describedText(field: HotelInfoField, error: string) {
  return field === "phone"
    ? `${HOTEL_INFO_MESSAGES.phoneHint} ${error}`
    : error;
}

function getInvalidFields() {
  return Object.values(getFields()).filter(
    (field) => field.getAttribute("aria-invalid") === "true",
  );
}

function getSubmitButton() {
  return screen.getByRole("button", { name: HOTEL_EDIT_MESSAGES.submit });
}

function queryReloadButton() {
  return screen.queryByRole("button", { name: HOTEL_EDIT_MESSAGES.reload });
}

function getReloadButton() {
  return screen.getByRole("button", { name: HOTEL_EDIT_MESSAGES.reload });
}

function expectAboveButtons(alert: HTMLElement) {
  const row = alert.parentElement;
  expect(row?.previousElementSibling).toContainElement(getHotelInfoGroup());
  expect(row?.nextElementSibling).toContainElement(getSubmitButton());
}

async function replaceValue(
  user: UserEvent,
  field: HotelInfoField,
  value: string,
) {
  await user.clear(getFields()[field]);
  if (value !== "") {
    await user.paste(value);
  }
}

async function expectNotFound() {
  expect(await screen.findByRole("alert")).toHaveTextContent(
    HOTEL_NOT_FOUND_MESSAGES.description,
  );
  expect(screen.getAllByRole("button")).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: HOTEL_NOT_FOUND_MESSAGES.backToList }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("group")).not.toBeInTheDocument();
}

beforeEach(() => {
  fetchHotel.mockResolvedValue(HOTEL);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("HotelEditPage 불러오기", () => {
  it("상세 조회 값으로 호텔 정보 폼을 채운다", async () => {
    await renderLoadedHotelEditPage();

    expectFormValues(valuesOf(HOTEL));
    expect(fetchHotel).toHaveBeenCalledExactlyOnceWith(HOTEL.id);
  });

  it("상세 캐시가 있으면 불러오는 중 없이 그 값으로 바로 채운다", async () => {
    fetchHotel.mockReturnValue(new Promise<never>(() => {}));
    renderHotelEditPage({ cachedHotel: HOTEL });

    await screen.findByRole("group", { name: HOTEL_INFO_MESSAGES.legend });

    expectFormValues(valuesOf(HOTEL));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("처음 불러오는 동안 불러오는 중 문구만 보여준다", async () => {
    fetchHotel.mockReturnValue(new Promise<never>(() => {}));
    renderHotelEditPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      HOTEL_LOAD_MESSAGES.loading,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each(["abc", "0", "1.5"])(
    "id가 %s면 조회하지 않고 찾을 수 없다는 문구와 목록으로 버튼만 보여준다",
    async (hotelId) => {
      renderHotelEditPage({ hotelId });

      await expectNotFound();
      expect(fetchHotel).not.toHaveBeenCalled();
    },
  );

  it("호텔이 없다는 404 응답이면 찾을 수 없다는 문구와 목록으로 버튼만 보여준다", async () => {
    fetchHotel.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.hotelNotFound),
    );
    renderHotelEditPage();

    await expectNotFound();
  });

  it("그 밖의 오류면 오류 문구와 다시 시도 버튼을 보여주고, 누르면 다시 조회해 폼을 채운다", async () => {
    fetchHotel
      .mockRejectedValueOnce(createApiError(500, "INTERNAL_SERVER_ERROR"))
      .mockResolvedValueOnce(HOTEL);
    const { user } = renderHotelEditPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      HOTEL_LOAD_MESSAGES.loadFailed,
    );
    await user.click(
      screen.getByRole("button", { name: HOTEL_LOAD_MESSAGES.retry }),
    );

    await screen.findByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
    expectFormValues(valuesOf(HOTEL));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchHotel).toHaveBeenCalledTimes(2);
  });

  it("뒤에서 다시 조회돼도 입력 중인 값을 덮지 않고 처음 채운 version으로 저장한다", async () => {
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user, queryClient } = await renderLoadedHotelEditPage();
    await replaceValue(user, "name", "입력 중인 이름");
    fetchHotel.mockResolvedValue(LATEST_HOTEL);

    await act(() =>
      queryClient.invalidateQueries({ queryKey: hotelQueryKey(HOTEL.id) }),
    );

    expect(queryClient.getQueryData(hotelQueryKey(HOTEL.id))).toEqual(
      LATEST_HOTEL,
    );
    expectFormValues({ ...valuesOf(HOTEL), name: "입력 중인 이름" });

    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotel).mock.lastCall?.[1]).toMatchObject({
      name: "입력 중인 이름",
      version: HOTEL.version,
    });
  });
});

describe("HotelEditPage 폼", () => {
  it("등록과 같은 입력 칸 아래에 저장·취소 버튼을 둔다", async () => {
    await renderLoadedHotelEditPage();

    const fields = getFields();
    expect(within(getHotelInfoGroup()).getAllByRole("textbox")).toEqual([
      fields.name,
      fields.address,
      fields.phone,
      fields.description,
    ]);
    expect(fields.description.tagName).toBe("TEXTAREA");
    expect(screen.getAllByText(HOTEL_INFO_MESSAGES.optional)).toHaveLength(1);
    expect(fields.phone).toHaveAccessibleDescription(
      HOTEL_INFO_MESSAGES.phoneHint,
    );
    for (const field of Object.values(fields)) {
      expect(field).not.toHaveAttribute("maxlength");
    }
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    expect(
      screen.getByRole("button", { name: HOTEL_EDIT_MESSAGES.cancel }),
    ).toHaveAttribute("type", "button");
  });

  it("칸을 모두 비우고 저장하면 소개를 뺀 칸에 필수 오류를 보여주고 첫 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderLoadedHotelEditPage();

    for (const field of HOTEL_INFO_FIELDS) {
      await replaceValue(user, field, "   ");
    }
    await user.click(getSubmitButton());

    const fields = getFields();
    expect(getInvalidFields()).toEqual([
      fields.name,
      fields.address,
      fields.phone,
    ]);
    expect(
      screen.getAllByText(FORM_VALIDATION_MESSAGES.required),
    ).toHaveLength(3);
    expect(fields.name).toHaveFocus();
    expect(updateHotel).not.toHaveBeenCalled();
  });

  it("입력창을 고치면 그 입력창의 오류만 지운다", async () => {
    const { user } = await renderLoadedHotelEditPage();
    await replaceValue(user, "name", "");
    await replaceValue(user, "address", "");
    await user.click(getSubmitButton());

    await user.type(getFields().name, "a");

    expect(getInvalidFields()).toEqual([getFields().address]);
  });

  it.each<[string, HotelInfoField, string, string]>([
    [
      "전화번호 형식이 틀리면",
      "phone",
      "02-1234-567a",
      FORM_VALIDATION_MESSAGES.phoneFormat,
    ],
    [
      "이름이 100자를 넘으면",
      "name",
      "가".repeat(101),
      FORM_VALIDATION_MESSAGES.maxLength(100),
    ],
  ])(
    "%s 그 칸에 오류 하나만 보여주고 초점을 옮기며 요청하지 않는다",
    async (_, field, value, message) => {
      const { user } = await renderLoadedHotelEditPage();

      await replaceValue(user, field, value);
      await user.click(getSubmitButton());

      const input = getFields()[field];
      expect(getInvalidFields()).toEqual([input]);
      expect(input).toHaveAccessibleDescription(describedText(field, message));
      expect(input).toHaveFocus();
      expect(updateHotel).not.toHaveBeenCalled();
    },
  );
});

describe("HotelEditPage 저장", () => {
  it("바뀐 값이 없어도 처음 채운 값과 version으로 저장을 요청한다", async () => {
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    expect(updateHotel).toHaveBeenCalledExactlyOnceWith(HOTEL.id, {
      ...valuesOf(HOTEL),
      version: HOTEL.version,
    });
  });

  it("앞뒤 공백을 지운 값으로 요청하고 소개의 줄바꿈은 그대로 보낸다", async () => {
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedHotelEditPage();

    await replaceValue(user, "name", `  ${LATEST_HOTEL.name}  `);
    await replaceValue(user, "phone", ` ${HOTEL.phone} `);
    await replaceValue(user, "description", "  첫 줄\n\n  둘째 줄  \n");
    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotel).mock.lastCall?.[1]).toEqual({
      name: LATEST_HOTEL.name,
      address: HOTEL.address,
      phone: HOTEL.phone,
      description: "첫 줄\n\n  둘째 줄",
      version: HOTEL.version,
    });
  });

  it("소개가 공백과 줄바꿈만 있으면 null로 보낸다", async () => {
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedHotelEditPage();

    await replaceValue(user, "description", "  \n  ");
    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotel).mock.lastCall?.[1]).toMatchObject({
      description: null,
    });
  });

  it("저장 요청 중에는 저장 버튼이 로딩 상태이고 다시 제출해도 요청하지 않는다", async () => {
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    expect(getSubmitButton()).toHaveAttribute("aria-busy", "true");
    expect(getSubmitButton()).toBeDisabled();

    await user.click(getFields().name);
    await user.keyboard("{Enter}{Enter}");
    await user.click(getSubmitButton());

    expect(updateHotel).toHaveBeenCalledOnce();
  });

  it("저장에 성공하면 응답을 상세 캐시에 넣고 목록 캐시를 무효화한 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    const updatedHotel = { ...LATEST_HOTEL, version: HOTEL.version + 1 };
    vi.mocked(updateHotel).mockResolvedValue(updatedHotel);
    const { user, router, queryClient } = await renderLoadedHotelEditPage();
    const listQueryKey = hotelListQueryKey({ page: 0 });
    queryClient.setQueryData(listQueryKey, EMPTY_HOTEL_PAGE);

    await user.click(getSubmitButton());

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(router.state.location.href).toBe(hotelPath(HOTEL.id));
    expect(queryClient.getQueryData(hotelQueryKey(HOTEL.id))).toEqual(
      updatedHotel,
    );
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(router.history.length).toBe(2);
  });

  it("취소를 누르면 확인 없이 요청하지 않고 상세로 이동한다", async () => {
    const { user, router } = await renderLoadedHotelEditPage();

    await replaceValue(user, "name", "바꾼 이름");
    await user.click(
      screen.getByRole("button", { name: HOTEL_EDIT_MESSAGES.cancel }),
    );

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(router.state.location.href).toBe(hotelPath(HOTEL.id));
    expect(updateHotel).not.toHaveBeenCalled();
  });
});

describe("HotelEditPage 서버 오류 처리", () => {
  it("입력 오류 응답의 필드 오류를 해당 칸에 보여주고 첫 번째로 틀린 칸에 초점을 옮긴다", async () => {
    vi.mocked(updateHotel).mockRejectedValue(
      createAxiosError(
        400,
        createErrorBody("INVALID_INPUT", "입력값이 올바르지 않습니다.", [
          { field: "phone", message: "전화번호 서버 오류" },
          { field: "address", message: "주소 서버 오류" },
        ]),
      ),
    );
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    const fields = getFields();
    await vi.waitFor(() => {
      expect(fields.address).toHaveFocus();
    });
    expect(getInvalidFields()).toEqual([fields.address, fields.phone]);
    expect(fields.address).toHaveAccessibleDescription("주소 서버 오류");
    expect(fields.phone).toHaveAccessibleDescription(
      describedText("phone", "전화번호 서버 오류"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["같은 호텔이 있다는 응답", 409, API_ERROR_CODES.hotelDuplicated],
    ["저장할 때 호텔이 없다는 응답", 404, API_ERROR_CODES.hotelNotFound],
    ["서버 오류 응답", 500, "INTERNAL_SERVER_ERROR"],
  ])(
    "%s이면 서버 문구를 제출 버튼 위 알림으로 보여주고 최신 내용 불러오기 버튼은 두지 않는다",
    async (_, status, code) => {
      const message = `${code} 서버 문구`;
      vi.mocked(updateHotel).mockRejectedValue(
        createApiError(status, code, message),
      );
      const { user } = await renderLoadedHotelEditPage();

      await user.click(getSubmitButton());

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(message);
      expectAboveButtons(alert);
      expect(queryReloadButton()).not.toBeInTheDocument();
      expect(getInvalidFields()).toEqual([]);
      expectFormValues(valuesOf(HOTEL));
      expect(getSubmitButton()).not.toBeDisabled();
    },
  );

  it("본문을 쓸 수 없는 오류면 일반 오류 문구를 제출 버튼 위 알림으로 보여준다", async () => {
    vi.mocked(updateHotel).mockRejectedValue(
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
    );
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(HOTEL_EDIT_MESSAGES.requestFailed);
    expectAboveButtons(alert);
  });

  it("로그인이 필요하다는 응답은 전역 오류 처리기로 넘긴다", async () => {
    const error = createApiError(401, API_ERROR_CODES.unauthorized);
    vi.mocked(updateHotel).mockRejectedValue(error);
    const { user } = await renderLoadedHotelEditPage();

    await user.click(getSubmitButton());

    await vi.waitFor(() => {
      expect(onMutationError).toHaveBeenCalledOnce();
    });
    expect(onMutationError.mock.lastCall?.[0]).toBe(error);
  });
});

describe("HotelEditPage 수정 충돌", () => {
  async function submitWithConflict(user: UserEvent) {
    vi.mocked(updateHotel).mockRejectedValueOnce(
      createApiError(
        409,
        API_ERROR_CODES.hotelModified,
        HOTEL_MODIFIED_MESSAGE,
      ),
    );
    await replaceValue(user, "name", "입력한 이름");
    await user.click(getSubmitButton());
    return screen.findByRole("alert");
  }

  it("다른 사용자가 먼저 수정했다는 응답이면 서버 문구 알림 옆에 최신 내용 불러오기 버튼을 둔다", async () => {
    const { user } = await renderLoadedHotelEditPage();

    const alert = await submitWithConflict(user);

    expect(alert).toHaveTextContent(HOTEL_MODIFIED_MESSAGE);
    expectAboveButtons(alert);
    const reloadButton = getReloadButton();
    expect(reloadButton.parentElement).toBe(alert.parentElement);
    expect(reloadButton).toHaveAttribute("type", "button");
    expectFormValues({ ...valuesOf(HOTEL), name: "입력한 이름" });
  });

  it("최신 내용 불러오기를 누르면 새로 조회해 최신 값과 version으로 폼을 다시 채우고 알림을 지우며 첫 칸에 초점을 옮긴 뒤, 저장하면 새 version을 보낸다", async () => {
    const { user } = await renderLoadedHotelEditPage();
    await submitWithConflict(user);
    fetchHotel.mockResolvedValue(LATEST_HOTEL);
    vi.mocked(updateHotel).mockReturnValue(new Promise<never>(() => {}));

    await user.click(getReloadButton());

    await vi.waitFor(() => {
      expectFormValues(valuesOf(LATEST_HOTEL));
    });
    expect(fetchHotel).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getInvalidFields()).toEqual([]);
    expect(getFields().name).toHaveFocus();

    await user.click(getSubmitButton());

    expect(vi.mocked(updateHotel).mock.lastCall?.[1]).toEqual({
      ...valuesOf(LATEST_HOTEL),
      description: null,
      version: LATEST_HOTEL.version,
    });
  });

  it("다시 불러오는 동안 최신 내용 불러오기 버튼은 로딩 상태이고 저장할 수 없다", async () => {
    const { user } = await renderLoadedHotelEditPage();
    await submitWithConflict(user);
    fetchHotel.mockReturnValue(new Promise<never>(() => {}));

    await user.click(getReloadButton());
    await user.click(getFields().name);
    await user.keyboard("{Enter}");

    expect(getReloadButton()).toHaveAttribute("aria-busy", "true");
    expect(getSubmitButton()).toBeDisabled();
    expect(updateHotel).toHaveBeenCalledOnce();
  });

  it("다시 불러오지 못하면 입력한 내용을 그대로 두고 불러오기 실패 문구와 최신 내용 불러오기 버튼을 보여주며 그 버튼에 초점을 돌린다", async () => {
    const { user } = await renderLoadedHotelEditPage();
    await submitWithConflict(user);
    let failReload: (error: unknown) => void = () => {};
    fetchHotel.mockReturnValue(
      new Promise((_, reject) => {
        failReload = reject;
      }),
    );

    await user.click(getReloadButton());
    await user.click(getFields().name);
    await act(async () => {
      failReload(createApiError(500, "INTERNAL_SERVER_ERROR"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      HOTEL_LOAD_MESSAGES.loadFailed,
    );
    expect(getReloadButton()).not.toBeDisabled();
    expect(getReloadButton()).toHaveFocus();
    expect(getSubmitButton()).not.toBeDisabled();
    expectFormValues({ ...valuesOf(HOTEL), name: "입력한 이름" });
  });

  it("다시 불러올 때 호텔이 없다는 응답이면 찾을 수 없음을 보여준다", async () => {
    const { user } = await renderLoadedHotelEditPage();
    await submitWithConflict(user);
    fetchHotel.mockRejectedValue(
      createApiError(404, API_ERROR_CODES.hotelNotFound),
    );

    await user.click(getReloadButton());

    await vi.waitFor(() => {
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });
    await expectNotFound();
  });
});
