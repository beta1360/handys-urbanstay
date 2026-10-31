import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  getGuestsQueryPageDefault,
  getGuestsQuerySizeDefault,
} from "./generated/zod";
import {
  createGuest,
  fetchGuest,
  fetchGuests,
  guestListQueryKey,
  guestQueryKey,
  updateGuest,
} from "./guest";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getGuests: vi.fn(),
  getGuest: vi.fn(),
  createGuest: vi.fn(),
  updateGuest: vi.fn(),
}));

const GUEST_ID = 1;

const GUEST = {
  id: GUEST_ID,
  name: "김이용",
  phone: "010-1234-5678",
  email: "guest@example.com",
  version: 0,
};

const GUEST_WITH_EXTRA_FIELD = { ...GUEST, createdAt: "2026-10-31T00:00:00Z" };

const GUEST_RESPONSE = {
  success: true,
  data: GUEST,
  message: null,
  error: null,
};

const CREATE_MESSAGE = "이용객을 등록했습니다.";

const UPDATE_MESSAGE = "이용객 정보를 수정했습니다.";

const GUEST_PAGE = {
  items: [GUEST],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

const GUEST_PAGE_RESPONSE = {
  success: true,
  data: GUEST_PAGE,
  message: null,
  error: null,
};

const LIST_PARAMS = { keyword: "010", page: 1, size: 10 };

const CREATE_BODY = {
  name: GUEST.name,
  phone: GUEST.phone,
  email: GUEST.email,
};

const UPDATE_BODY = { ...CREATE_BODY, version: GUEST.version };

const UNSUCCESSFUL_RESPONSE_OVERRIDES = [
  ["success가 false", { success: false }],
  ["data가 null", { data: null }],
] as const;

const GUEST_CHANGE_OPERATIONS = [
  {
    name: "createGuest",
    message: CREATE_MESSAGE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.createGuest).mockResolvedValue(response as never),
    run: () => createGuest(CREATE_BODY),
  },
  {
    name: "updateGuest",
    message: UPDATE_MESSAGE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.updateGuest).mockResolvedValue(response as never),
    run: () => updateGuest(GUEST_ID, UPDATE_BODY),
  },
];

const GUEST_OPERATIONS = [
  {
    name: "fetchGuest",
    message: null,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.getGuest).mockResolvedValue(response as never),
    run: () => fetchGuest(GUEST_ID),
  },
  ...GUEST_CHANGE_OPERATIONS,
];

function toResult(message: string | null, guest: unknown) {
  return message === null ? guest : { data: guest, message };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchGuests", () => {
  it("파라미터와 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getGuests).mockResolvedValue(GUEST_PAGE_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchGuests(LIST_PARAMS, { signal })).resolves.toEqual(
      GUEST_PAGE,
    );
    expect(generated.getGuests).toHaveBeenCalledWith(
      LIST_PARAMS,
      undefined,
      signal,
    );
  });

  it("빠진 page·size는 스키마 기본값을 채워 보낸다", async () => {
    vi.mocked(generated.getGuests).mockResolvedValue(GUEST_PAGE_RESPONSE);

    await fetchGuests({});

    expect(generated.getGuests).toHaveBeenCalledWith(
      { page: getGuestsQueryPageDefault, size: getGuestsQuerySizeDefault },
      undefined,
      undefined,
    );
  });

  it.each([
    ["page가 범위를 넘으면", { page: 100 }],
    ["keyword가 100자를 넘으면", { keyword: "a".repeat(101) }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, params) => {
    await expect(fetchGuests(params)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getGuests).not.toHaveBeenCalled();
  });

  it.each([
    ...UNSUCCESSFUL_RESPONSE_OVERRIDES,
    [
      "항목의 필드가 빠지면",
      { data: { ...GUEST_PAGE, items: [{ ...GUEST, email: undefined }] } },
    ] as const,
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, override) => {
    vi.mocked(generated.getGuests).mockResolvedValue({
      ...GUEST_PAGE_RESPONSE,
      ...override,
    } as never);

    await expect(fetchGuests(LIST_PARAMS)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("쿼리 키", () => {
  it("생성된 목록·상세 쿼리 키를 쓴다", () => {
    expect(guestListQueryKey(LIST_PARAMS)).toEqual(
      generated.getGetGuestsQueryKey(LIST_PARAMS),
    );
    expect(guestQueryKey(GUEST_ID)).toEqual(
      generated.getGetGuestQueryKey(GUEST_ID),
    );
  });

  it("파라미터 없이 만든 목록 키는 모든 목록 쿼리를 가리키고 상세 쿼리는 가리키지 않는다", async () => {
    const queryClient = new QueryClient();
    const firstPageKey = guestListQueryKey({});
    const searchedKey = guestListQueryKey(LIST_PARAMS);
    const detailKey = guestQueryKey(GUEST_ID);
    queryClient.setQueryData(firstPageKey, GUEST_PAGE);
    queryClient.setQueryData(searchedKey, GUEST_PAGE);
    queryClient.setQueryData(detailKey, GUEST);

    await queryClient.invalidateQueries({ queryKey: guestListQueryKey() });

    const isInvalidated = (queryKey: readonly unknown[]) =>
      queryClient.getQueryState(queryKey)?.isInvalidated;
    expect(isInvalidated(firstPageKey)).toBe(true);
    expect(isInvalidated(searchedKey)).toBe(true);
    expect(isInvalidated(detailKey)).toBe(false);
  });
});

describe("fetchGuest", () => {
  it("이용객 ID와 signal을 넘겨 이용객을 돌려준다", async () => {
    vi.mocked(generated.getGuest).mockResolvedValue(GUEST_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchGuest(GUEST_ID, { signal })).resolves.toEqual(GUEST);
    expect(generated.getGuest).toHaveBeenCalledWith(
      GUEST_ID,
      undefined,
      signal,
    );
  });
});

describe("createGuest·updateGuest", () => {
  it("스키마에 없는 필드를 버린 본문으로 등록하고 등록한 이용객과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.createGuest).mockResolvedValue({
      ...GUEST_RESPONSE,
      message: CREATE_MESSAGE,
    });

    const bodyWithExtraField = { ...CREATE_BODY, extra: true };

    await expect(createGuest(bodyWithExtraField)).resolves.toEqual({
      data: GUEST,
      message: CREATE_MESSAGE,
    });
    expect(generated.createGuest).toHaveBeenCalledWith(CREATE_BODY);
  });

  it("이용객 ID와 version이 담긴 본문으로 수정하고 수정한 이용객과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateGuest).mockResolvedValue({
      ...GUEST_RESPONSE,
      message: UPDATE_MESSAGE,
    });

    await expect(updateGuest(GUEST_ID, UPDATE_BODY)).resolves.toEqual({
      data: GUEST,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateGuest).toHaveBeenCalledWith(GUEST_ID, UPDATE_BODY);
  });

  it.each([
    [
      "전화번호 형식이 틀리면",
      () => createGuest({ ...CREATE_BODY, phone: "010-123" }),
    ],
    [
      "이메일 형식이 틀리면",
      () => createGuest({ ...CREATE_BODY, email: "guest" }),
    ],
    [
      "이용객 ID가 정수가 아니면",
      () => updateGuest(Number.NaN, UPDATE_BODY),
    ],
    [
      "version이 정수가 아니면",
      () => updateGuest(GUEST_ID, { ...UPDATE_BODY, version: 0.5 }),
    ],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, run) => {
    await expect(run()).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.createGuest).not.toHaveBeenCalled();
    expect(generated.updateGuest).not.toHaveBeenCalled();
  });
});

describe.each(GUEST_OPERATIONS)(
  "$name 응답 검증",
  ({ message, mockResponse, run }) => {
    it.each([
      ...UNSUCCESSFUL_RESPONSE_OVERRIDES,
      ["타입이 틀리면", { data: { ...GUEST, id: String(GUEST_ID) } }] as const,
    ])("응답의 %s 응답 검증 오류를 던진다", async (_, override) => {
      mockResponse({ ...GUEST_RESPONSE, message, ...override });

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });

    it("응답에 스키마에 없는 필드가 있으면 버린다", async () => {
      mockResponse({
        ...GUEST_RESPONSE,
        message,
        data: GUEST_WITH_EXTRA_FIELD,
      });

      await expect(run()).resolves.toEqual(toResult(message, GUEST));
    });
  },
);

describe.each(GUEST_CHANGE_OPERATIONS)(
  "$name 성공 문구 검증",
  ({ mockResponse, run }) => {
    it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
      mockResponse(GUEST_RESPONSE);

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });
  },
);
