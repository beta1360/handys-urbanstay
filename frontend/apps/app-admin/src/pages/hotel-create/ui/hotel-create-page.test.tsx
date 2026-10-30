import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
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
import { HOTEL_FIELD_LABELS, HOTEL_INFO_MESSAGES } from "@/entities/hotel";
import { HOTEL_CREATE_FORM_MESSAGES } from "@/features/hotel-create";
import {
  API_ERROR_CODES,
  createHotel,
  hotelListQueryKey,
  hotelQueryKey,
} from "@/shared/api";
import type { Hotel, HotelPage } from "@/shared/api";
import { COMMON_MESSAGES, FORM_VALIDATION_MESSAGES } from "@/shared/config";
import { parseSearch, stringifySearch } from "@/shared/lib/search-params";
import { dismissToast, showToast } from "@/shared/lib/toast";
import { HotelCreatePage } from "./hotel-create-page";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  createHotel: vi.fn(),
}));

vi.mock("@/shared/lib/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib/toast")>()),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}));

const onMutationError = vi.fn();

const CREATE_MESSAGE = "호텔을 등록했습니다.";

const DETAIL_PAGE_TEXT = "호텔 상세 화면";

const HOTEL: Hotel = {
  id: 7,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: null,
  version: 0,
};

const EMPTY_HOTEL_PAGE: HotelPage = {
  items: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
};

const VALID_INPUT = {
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: "",
  loginId: "master@urbanstay.com",
  masterName: "홍길동",
  password: "urbanstay123!",
};

type FormInput = typeof VALID_INPUT;

type InputField = keyof FormInput;

const INPUT_FIELDS = Object.keys(VALID_INPUT) as InputField[];

const REQUIRED_FIELDS = INPUT_FIELDS.filter(
  (field) => field !== "description",
);

const PASSWORD_HINT = HOTEL_CREATE_FORM_MESSAGES.masterPasswordHint(8, 64);

const PASSWORD_RULE = FORM_VALIDATION_MESSAGES.passwordRule(8, 64);

const FIELD_HINTS: Partial<Record<InputField, string>> = {
  phone: HOTEL_INFO_MESSAGES.phoneHint,
  loginId: HOTEL_CREATE_FORM_MESSAGES.masterLoginIdHint,
  password: PASSWORD_HINT,
};

function describedText(field: InputField, error?: string) {
  return [FIELD_HINTS[field], error].filter(Boolean).join(" ");
}

type FieldError = { field: string; message: string };

function createErrorBody(
  code: string,
  message: string,
  fieldErrors: FieldError[] = [],
) {
  return {
    success: false,
    data: null,
    message: null,
    error: { code, message, fieldErrors },
  };
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

async function renderHotelCreatePage() {
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
        createRoute({ getParentRoute: () => layoutRoute, path: "hotels/" }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "hotels/new",
          component: HotelCreatePage,
        }),
        createRoute({
          getParentRoute: () => layoutRoute,
          path: "hotels/$hotelId",
          component: () => <p>{DETAIL_PAGE_TEXT}</p>,
        }),
      ]),
    ]),
    history: createMemoryHistory({
      initialEntries: ["/hotels", "/hotels/new"],
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
  await screen.findByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
  return { router, queryClient, user: userEvent.setup() };
}

function getHotelInfoGroup() {
  return screen.getByRole("group", { name: HOTEL_INFO_MESSAGES.legend });
}

function getMasterGroup() {
  return screen.getByRole("group", { name: HOTEL_CREATE_FORM_MESSAGES.masterLegend });
}

function getFields(): Record<InputField, HTMLElement> {
  const hotelInfo = within(getHotelInfoGroup());
  const master = within(getMasterGroup());
  return {
    name: hotelInfo.getByLabelText(HOTEL_FIELD_LABELS.name),
    address: hotelInfo.getByLabelText(HOTEL_FIELD_LABELS.address),
    phone: hotelInfo.getByLabelText(HOTEL_FIELD_LABELS.phone),
    description: hotelInfo.getByLabelText(
      `${HOTEL_FIELD_LABELS.description} ${HOTEL_INFO_MESSAGES.optional}`,
    ),
    loginId: master.getByLabelText(HOTEL_CREATE_FORM_MESSAGES.masterLoginIdLabel),
    masterName: master.getByLabelText(HOTEL_CREATE_FORM_MESSAGES.masterNameLabel),
    password: master.getByLabelText(HOTEL_CREATE_FORM_MESSAGES.masterPasswordLabel),
  };
}

function getSubmitButton() {
  return screen.getByRole("button", { name: HOTEL_CREATE_FORM_MESSAGES.submit });
}

function getCancelLink() {
  return screen.getByRole("link", { name: COMMON_MESSAGES.cancel });
}

function getInvalidFields() {
  return Object.values(getFields()).filter(
    (field) => field.getAttribute("aria-invalid") === "true",
  );
}

async function fillForm(user: UserEvent, input: Partial<FormInput> = {}) {
  const values = { ...VALID_INPUT, ...input };
  const fields = getFields();
  for (const field of INPUT_FIELDS) {
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
  vi.restoreAllMocks();
});

describe("HotelCreatePage 화면", () => {
  it("호텔 정보와 마스터 계정 묶음으로 입력창을 나눠 보여주고 아래에 등록·취소 버튼을 둔다", async () => {
    await renderHotelCreatePage();

    const fields = getFields();
    expect(getHotelInfoGroup().tagName).toBe("FIELDSET");
    expect(within(getHotelInfoGroup()).getAllByRole("textbox")).toEqual([
      fields.name,
      fields.address,
      fields.phone,
      fields.description,
    ]);
    expect(within(getMasterGroup()).getAllByRole("textbox")).toEqual([
      fields.loginId,
      fields.masterName,
    ]);
    expect(getSubmitButton()).toHaveAttribute("type", "submit");
    const cancelLink = getCancelLink();
    expect(cancelLink).toHaveAttribute("href", "/hotels");
    expect(cancelLink).not.toHaveAttribute("aria-current");
  });

  it("형식이 있는 칸에만 안내 문구를 보여주고 입력창과 연결한다", async () => {
    await renderHotelCreatePage();

    const fields = getFields();
    for (const field of INPUT_FIELDS) {
      if (FIELD_HINTS[field] === undefined) {
        expect(fields[field]).not.toHaveAttribute("aria-describedby");
      } else {
        expect(fields[field]).toHaveAccessibleDescription(describedText(field));
      }
    }
  });

  it("소개 이름 옆에만 (선택)을 붙이고 소개는 여러 줄 입력창이다", async () => {
    await renderHotelCreatePage();

    expect(screen.getAllByText(HOTEL_INFO_MESSAGES.optional)).toHaveLength(1);
    expect(getFields().description.tagName).toBe("TEXTAREA");
  });

  it("마스터 아이디는 이메일 입력창이고 비밀번호는 가려지며 둘 다 로그인한 계정으로 자동 완성되지 않는다", async () => {
    await renderHotelCreatePage();

    const { loginId, password } = getFields();
    expect(loginId).toHaveAttribute("type", "email");
    expect(loginId).toHaveAttribute("autocomplete", "off");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(within(getMasterGroup()).queryByRole("button")).toBeNull();
  });

  it("입력창에 글자 수 제한을 걸지 않는다", async () => {
    await renderHotelCreatePage();

    for (const field of Object.values(getFields())) {
      expect(field).not.toHaveAttribute("maxlength");
    }
  });

  it("/hotels/new는 호텔 상세가 아닌 등록 화면으로 잡힌다", async () => {
    const { router } = await renderHotelCreatePage();

    expect(router.state.matches.at(-1)?.routeId).toBe(
      "/_authenticated/hotels/new",
    );
    expect(screen.queryByText(DETAIL_PAGE_TEXT)).not.toBeInTheDocument();
  });
});

describe("HotelCreatePage 입력 검사", () => {
  it("입력 없이 제출하면 소개를 뺀 모든 칸에 필수 오류를 보여주고 첫 칸에 초점을 옮기며 요청하지 않는다", async () => {
    const { user } = await renderHotelCreatePage();

    await user.click(getSubmitButton());

    const fields = getFields();
    for (const field of REQUIRED_FIELDS) {
      expect(fields[field]).toHaveAttribute("aria-invalid", "true");
      expect(fields[field]).toHaveAccessibleDescription(
        describedText(field, FORM_VALIDATION_MESSAGES.required),
      );
    }
    expect(fields.description).not.toHaveAttribute("aria-invalid");
    expect(fields.name).toHaveFocus();
    expect(createHotel).not.toHaveBeenCalled();
  });

  it("공백만 입력한 칸은 빈 값으로 보고 필수 오류를 보여준다", async () => {
    const { user } = await renderHotelCreatePage();

    await fillForm(
      user,
      Object.fromEntries(INPUT_FIELDS.map((field) => [field, "   "])),
    );
    await user.click(getSubmitButton());

    expect(getInvalidFields()).toEqual(
      REQUIRED_FIELDS.map((field) => getFields()[field]),
    );
    expect(
      screen.getAllByText(FORM_VALIDATION_MESSAGES.required),
    ).toHaveLength(REQUIRED_FIELDS.length);
    expect(createHotel).not.toHaveBeenCalled();
  });

  it("입력하는 동안에는 검사하지 않는다", async () => {
    const { user } = await renderHotelCreatePage();

    await fillForm(user, { phone: "abc", loginId: "master" });

    expect(getInvalidFields()).toEqual([]);
    expect(
      screen.queryByText(FORM_VALIDATION_MESSAGES.phoneFormat),
    ).not.toBeInTheDocument();
  });

  it("입력창을 고치면 그 입력창의 오류만 지운다", async () => {
    const { user } = await renderHotelCreatePage();

    await user.click(getSubmitButton());
    await user.type(getFields().name, "a");
    await user.type(getFields().password, "a");

    const fields = getFields();
    expect(fields.name).not.toHaveAttribute("aria-invalid");
    expect(fields.password).not.toHaveAttribute("aria-invalid");
    expect(fields.password).toHaveAccessibleDescription(PASSWORD_HINT);
    expect(fields.address).toHaveAttribute("aria-invalid", "true");
    expect(fields.masterName).toHaveAttribute("aria-invalid", "true");
  });

  it("여러 칸이 틀리면 화면 순서에서 첫 번째로 틀린 칸에 초점을 옮긴다", async () => {
    const { user } = await renderHotelCreatePage();

    await fillForm(user, { phone: "abc", masterName: "가".repeat(51) });
    await user.click(getSubmitButton());
    expect(getFields().phone).toHaveFocus();

    await user.clear(getFields().phone);
    await user.paste(VALID_INPUT.phone);
    await user.click(getSubmitButton());
    expect(getFields().masterName).toHaveFocus();
  });

  const { maxLength, phoneFormat, emailFormat } = FORM_VALIDATION_MESSAGES;
  const LONG_EMAIL = `${"a".repeat(245)}@urbanstay.com`;

  it.each<[string, InputField, string, string]>([
    ["이름이 100자를 넘으면", "name", "가".repeat(101), maxLength(100)],
    ["주소가 200자를 넘으면", "address", "가".repeat(201), maxLength(200)],
    ["전화번호에 숫자와 - 외의 글자가 있으면", "phone", "02-1234-567a", phoneFormat],
    ["전화번호의 숫자가 8개보다 적으면", "phone", "02-123-45", phoneFormat],
    ["전화번호의 숫자가 11개를 넘으면 길어도", "phone", "0".repeat(21), phoneFormat],
    ["형식이 맞는 전화번호가 20자를 넘으면", "phone", "02-1234-5678---------", maxLength(20)],
    ["소개가 1000자를 넘으면", "description", "가".repeat(1001), maxLength(1000)],
    ["아이디가 이메일 형식이 아니면", "loginId", "master", emailFormat],
    ["아이디가 이메일 형식이 아니면 길어도", "loginId", "a".repeat(255), emailFormat],
    ["형식이 맞는 아이디가 254자를 넘으면", "loginId", LONG_EMAIL, maxLength(254)],
    ["마스터 이름이 50자를 넘으면", "masterName", "가".repeat(51), maxLength(50)],
    ["비밀번호가 8자보다 짧으면", "password", "abc1234", PASSWORD_RULE],
    ["비밀번호가 64자보다 길면", "password", "a1".repeat(33), PASSWORD_RULE],
    ["비밀번호에 숫자가 없으면", "password", "urbanstay!", PASSWORD_RULE],
    ["비밀번호에 영문이 없으면", "password", "12345678!", PASSWORD_RULE],
    ["비밀번호에 한글이 있으면", "password", "어반스테이123abc", PASSWORD_RULE],
  ])(
    "%s 그 칸에 오류 하나만 보여주고 초점을 옮기며 요청하지 않는다",
    async (_, field, value, message) => {
      const { user } = await renderHotelCreatePage();

      await fillForm(user, { [field]: value });
      await user.click(getSubmitButton());

      const input = getFields()[field];
      expect(getInvalidFields()).toEqual([input]);
      expect(input).toHaveAccessibleDescription(describedText(field, message));
      expect(input).toHaveFocus();
      expect(createHotel).not.toHaveBeenCalled();
    },
  );
});

describe("HotelCreatePage 요청", () => {
  it("앞뒤 공백을 지운 값으로 요청하고 소개의 줄바꿈과 비밀번호는 입력한 그대로 보낸다", async () => {
    vi.mocked(createHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderHotelCreatePage();

    await fillForm(user, {
      name: `  ${VALID_INPUT.name}  `,
      address: ` ${VALID_INPUT.address} `,
      phone: ` ${VALID_INPUT.phone} `,
      description: "  첫 줄\n\n  둘째 줄  \n",
      loginId: ` ${VALID_INPUT.loginId} `,
      masterName: ` ${VALID_INPUT.masterName} `,
      password: "  abc123  ",
    });
    await user.click(getSubmitButton());

    expect(createHotel).toHaveBeenCalledExactlyOnceWith(
      {
        name: VALID_INPUT.name,
        address: VALID_INPUT.address,
        phone: VALID_INPUT.phone,
        description: "첫 줄\n\n  둘째 줄",
        master: {
          loginId: VALID_INPUT.loginId,
          name: VALID_INPUT.masterName,
          password: "  abc123  ",
        },
      },
      expect.anything(),
    );
  });

  it.each([
    ["비어 있으면", ""],
    ["공백과 줄바꿈만 있으면", "  \n  "],
  ])("소개가 %s null로 보낸다", async (_, description) => {
    vi.mocked(createHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderHotelCreatePage();

    await fillForm(user, { description });
    await user.click(getSubmitButton());

    expect(vi.mocked(createHotel).mock.lastCall?.[0]).toMatchObject({
      description: null,
    });
  });

  it("등록 요청 중에는 등록 버튼이 로딩 상태이고 다시 제출해도 요청하지 않는다", async () => {
    vi.mocked(createHotel).mockReturnValue(new Promise<never>(() => {}));
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    expect(getSubmitButton()).toHaveAttribute("aria-busy", "true");
    expect(getSubmitButton()).toBeDisabled();

    await user.click(getFields().name);
    await user.keyboard("{Enter}{Enter}");
    await user.click(getSubmitButton());

    expect(createHotel).toHaveBeenCalledOnce();
  });

  it("등록에 성공하면 서버의 성공 문구를 토스트로 띄우고 목록 캐시를 무효화하고 상세 캐시에 넣은 뒤 방문 기록을 바꿔 상세로 이동한다", async () => {
    vi.mocked(createHotel).mockResolvedValue({
      data: HOTEL,
      message: CREATE_MESSAGE,
    });
    const { user, router, queryClient } = await renderHotelCreatePage();
    const listQueryKey = hotelListQueryKey({ page: 0 });
    queryClient.setQueryData(listQueryKey, EMPTY_HOTEL_PAGE);

    await submitValidForm(user);

    expect(await screen.findByText(DETAIL_PAGE_TEXT)).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      message: CREATE_MESSAGE,
    });
    expect(router.state.location.href).toBe(`/hotels/${HOTEL.id}`);
    expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(hotelQueryKey(HOTEL.id))).toEqual(HOTEL);
    expect(router.history.length).toBe(2);

    router.history.back();
    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels");
    });
  });

  it("취소를 누르면 확인 없이 요청하지 않고 호텔 목록으로 이동한다", async () => {
    const { user, router } = await renderHotelCreatePage();

    await fillForm(user);
    await user.click(getCancelLink());

    await vi.waitFor(() => {
      expect(router.state.location.href).toBe("/hotels");
    });
    expect(createHotel).not.toHaveBeenCalled();
  });
});

describe("HotelCreatePage 서버 오류 처리", () => {
  it("입력 오류 응답의 필드 오류를 중첩 경로까지 해당 칸에 보여주고 첫 번째로 틀린 칸에 초점을 옮긴다", async () => {
    const fieldErrors = [
      { field: "master.password", message: "비밀번호 서버 오류" },
      { field: "address", message: "주소 서버 오류" },
      { field: "master.loginId", message: "아이디 서버 오류" },
    ];
    vi.mocked(createHotel).mockRejectedValue(
      createAxiosError(
        400,
        createErrorBody("INVALID_INPUT", "입력값이 올바르지 않습니다.", fieldErrors),
      ),
    );
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    const fields = getFields();
    await vi.waitFor(() => {
      expect(fields.address).toHaveFocus();
    });
    expect(getInvalidFields()).toEqual([
      fields.address,
      fields.loginId,
      fields.password,
    ]);
    expect(fields.address).toHaveAccessibleDescription("주소 서버 오류");
    expect(fields.loginId).toHaveAccessibleDescription(
      describedText("loginId", "아이디 서버 오류"),
    );
    expect(fields.password).toHaveAccessibleDescription(
      describedText("password", "비밀번호 서버 오류"),
    );
    expect(showToast).not.toHaveBeenCalled();
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it("아이디 중복 응답이면 서버 문구를 마스터 아이디 칸에 보여주고 초점을 옮긴다", async () => {
    const message = "이미 사용 중인 아이디입니다.";
    vi.mocked(createHotel).mockRejectedValue(
      createAxiosError(
        409,
        createErrorBody(API_ERROR_CODES.loginIdDuplicated, message),
      ),
    );
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    const { loginId } = getFields();
    await vi.waitFor(() => {
      expect(loginId).toHaveFocus();
    });
    expect(getInvalidFields()).toEqual([loginId]);
    expect(loginId).toHaveAccessibleDescription(
      describedText("loginId", message),
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it.each([
    [
      "같은 호텔이 있다는 응답",
      409,
      createErrorBody(
        API_ERROR_CODES.hotelDuplicated,
        "같은 이름과 주소의 호텔이 이미 있습니다.",
      ),
    ],
    [
      "필드를 알 수 없는 입력 오류 응답",
      400,
      createErrorBody("INVALID_INPUT", "입력값이 올바르지 않습니다.", [
        { field: "unknown", message: "알 수 없는 항목입니다." },
      ]),
    ],
    [
      "서버 오류 응답",
      500,
      createErrorBody("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다."),
    ],
  ])("%s이면 서버 문구를 폼 안이 아닌 오류 토스트로 보여준다", async (_, status, body) => {
    vi.mocked(createHotel).mockRejectedValue(createAxiosError(status, body));
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    await vi.waitFor(() => {
      expect(getSubmitButton()).not.toBeDisabled();
    });
    expect(showToast).toHaveBeenCalledExactlyOnceWith({
      type: "error",
      message: body.error.message,
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getInvalidFields()).toEqual([]);
  });

  it.each([
    ["네트워크 오류", new AxiosError("Network Error", AxiosError.ERR_NETWORK)],
    ["요청 검증 오류", new RequestValidationError("createHotel", [])],
    ["응답 검증 오류", new ResponseValidationError("createHotel", [])],
    ["형식이 다른 오류 응답", createAxiosError(502, "<html>Bad Gateway</html>")],
  ])("%s면 일반 오류 문구를 오류 토스트로 보여준다", async (_, error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createHotel).mockRejectedValue(error);
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledExactlyOnceWith({
        type: "error",
        message: COMMON_MESSAGES.requestFailed,
      });
    });
  });

  it("폼이 띄운 오류 토스트는 다시 제출하면 지운다", async () => {
    const toastId = 7;
    vi.mocked(showToast).mockReturnValue(toastId);
    vi.mocked(createHotel)
      .mockRejectedValueOnce(
        createAxiosError(
          409,
          createErrorBody(API_ERROR_CODES.hotelDuplicated, "중복 호텔"),
        ),
      )
      .mockReturnValueOnce(new Promise<never>(() => {}));
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);
    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledOnce();
    });
    expect(dismissToast).not.toHaveBeenCalled();

    await user.click(getSubmitButton());

    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(toastId);
    expect(createHotel).toHaveBeenCalledTimes(2);
  });

  it("로그인이 필요하다는 응답은 전역 오류 처리기로 넘기고 토스트를 띄우지 않는다", async () => {
    const error = createAxiosError(
      401,
      createErrorBody(API_ERROR_CODES.unauthorized, "로그인이 필요합니다."),
    );
    vi.mocked(createHotel).mockRejectedValue(error);
    const { user } = await renderHotelCreatePage();

    await submitValidForm(user);

    await vi.waitFor(() => {
      expect(onMutationError).toHaveBeenCalledOnce();
    });
    expect(onMutationError.mock.lastCall?.[0]).toBe(error);
    await vi.waitFor(() => {
      expect(getSubmitButton()).not.toBeDisabled();
    });
    expect(showToast).not.toHaveBeenCalled();
  });
});
