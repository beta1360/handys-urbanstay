import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as generated from "./generated";
import {
  getHotelsQueryPageDefault,
  getHotelsQuerySizeDefault,
} from "./generated/zod";
import {
  createHotel,
  fetchHotel,
  fetchHotels,
  hotelListQueryKey,
  hotelQueryKey,
  updateHotel,
} from "./hotel";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getHotels: vi.fn(),
  getHotel: vi.fn(),
  createHotel: vi.fn(),
  updateHotel: vi.fn(),
}));

const HOTEL_ID = 1;

const HOTEL = {
  id: HOTEL_ID,
  name: "어반스테이 강남",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  description: null,
  version: 0,
};

const HOTEL_WITH_EXTRA_FIELD = { ...HOTEL, createdAt: "2026-10-30T00:00:00Z" };

const HOTEL_RESPONSE = {
  success: true,
  data: HOTEL,
  message: null,
  error: null,
};

const CREATE_MESSAGE = "호텔을 등록했습니다.";

const UPDATE_MESSAGE = "호텔 정보를 수정했습니다.";

const CREATED_HOTEL_RESPONSE = { ...HOTEL_RESPONSE, message: CREATE_MESSAGE };

const UPDATED_HOTEL_RESPONSE = { ...HOTEL_RESPONSE, message: UPDATE_MESSAGE };

const HOTEL_PAGE = {
  items: [HOTEL],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

const HOTEL_PAGE_RESPONSE = {
  success: true,
  data: HOTEL_PAGE,
  message: null,
  error: null,
};

const LIST_PARAMS = { keyword: "강남", page: 1, size: 10 };

const CREATE_BODY = {
  name: HOTEL.name,
  address: HOTEL.address,
  phone: HOTEL.phone,
  master: {
    loginId: "master@example.com",
    name: "홍길동",
    password: "urbanstay123!",
  },
};

const UPDATE_BODY = {
  name: HOTEL.name,
  address: HOTEL.address,
  phone: HOTEL.phone,
  description: "강남역에서 걸어서 5분 거리입니다.",
  version: HOTEL.version,
};

const UNSUCCESSFUL_RESPONSE_OVERRIDES = [
  ["success가 false", { success: false }],
  ["data가 null", { data: null }],
] as const;

const INVALID_HOTELS = [
  ["필드가 빠지면", { ...HOTEL, version: undefined }],
  ["타입이 틀리면", { ...HOTEL, id: String(HOTEL_ID) }],
] as const;

const HOTEL_CHANGE_OPERATIONS = [
  {
    name: "createHotel",
    response: CREATED_HOTEL_RESPONSE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.createHotel).mockResolvedValue(response as never),
    run: () => createHotel(CREATE_BODY),
    toResult: (hotel: unknown) => ({ data: hotel, message: CREATE_MESSAGE }),
  },
  {
    name: "updateHotel",
    response: UPDATED_HOTEL_RESPONSE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.updateHotel).mockResolvedValue(response as never),
    run: () => updateHotel(HOTEL_ID, UPDATE_BODY),
    toResult: (hotel: unknown) => ({ data: hotel, message: UPDATE_MESSAGE }),
  },
];

const HOTEL_OPERATIONS = [
  {
    name: "fetchHotel",
    response: HOTEL_RESPONSE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.getHotel).mockResolvedValue(response as never),
    run: () => fetchHotel(HOTEL_ID),
    toResult: (hotel: unknown) => hotel,
  },
  ...HOTEL_CHANGE_OPERATIONS,
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchHotels", () => {
  it("파라미터와 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue(HOTEL_PAGE_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchHotels(LIST_PARAMS, { signal })).resolves.toEqual(
      HOTEL_PAGE,
    );
    expect(generated.getHotels).toHaveBeenCalledWith(
      LIST_PARAMS,
      undefined,
      signal,
    );
  });

  it("빠진 page·size는 스키마 기본값을 채워 보낸다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue(HOTEL_PAGE_RESPONSE);

    await fetchHotels({});

    expect(generated.getHotels).toHaveBeenCalledWith(
      { page: getHotelsQueryPageDefault, size: getHotelsQuerySizeDefault },
      undefined,
      undefined,
    );
  });

  it.each([
    ["page가 범위를 넘으면", { page: 100 }],
    ["page가 정수가 아니면", { page: 1.5 }],
    ["keyword가 100자를 넘으면", { keyword: "a".repeat(101) }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, params) => {
    await expect(fetchHotels(params)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getHotels).not.toHaveBeenCalled();
  });

  it.each(UNSUCCESSFUL_RESPONSE_OVERRIDES)(
    "성공 응답의 %s면 응답 검증 오류를 던진다",
    async (_, override) => {
      vi.mocked(generated.getHotels).mockResolvedValue({
        ...HOTEL_PAGE_RESPONSE,
        ...override,
      });

      await expect(fetchHotels(LIST_PARAMS)).rejects.toBeInstanceOf(
        ResponseValidationError,
      );
    },
  );

  it.each([
    ["필드가 빠지면", { ...HOTEL_PAGE, totalPages: undefined }],
    [
      "항목의 타입이 틀리면",
      { ...HOTEL_PAGE, items: [{ ...HOTEL, id: String(HOTEL_ID) }] },
    ],
  ])("응답의 %s 응답 검증 오류를 던진다", async (_, page) => {
    vi.mocked(generated.getHotels).mockResolvedValue({
      ...HOTEL_PAGE_RESPONSE,
      data: page,
    } as never);

    await expect(fetchHotels(LIST_PARAMS)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it("응답의 항목에 스키마에 없는 필드가 있으면 버린다", async () => {
    vi.mocked(generated.getHotels).mockResolvedValue({
      ...HOTEL_PAGE_RESPONSE,
      data: { ...HOTEL_PAGE, items: [HOTEL_WITH_EXTRA_FIELD] },
    });

    await expect(fetchHotels(LIST_PARAMS)).resolves.toEqual(HOTEL_PAGE);
  });
});

describe("hotelListQueryKey", () => {
  it("파라미터가 있으면 생성된 목록 쿼리 키를 쓴다", () => {
    expect(hotelListQueryKey(LIST_PARAMS)).toEqual(
      generated.getGetHotelsQueryKey(LIST_PARAMS),
    );
  });

  it("파라미터 없이 만들면 모든 목록 쿼리를 가리키고 상세 쿼리는 가리키지 않는다", async () => {
    const queryClient = new QueryClient();
    const firstPageKey = hotelListQueryKey({});
    const searchedKey = hotelListQueryKey(LIST_PARAMS);
    const detailKey = hotelQueryKey(HOTEL_ID);
    queryClient.setQueryData(firstPageKey, HOTEL_PAGE);
    queryClient.setQueryData(searchedKey, HOTEL_PAGE);
    queryClient.setQueryData(detailKey, HOTEL);

    await queryClient.invalidateQueries({ queryKey: hotelListQueryKey() });

    const isInvalidated = (queryKey: readonly unknown[]) =>
      queryClient.getQueryState(queryKey)?.isInvalidated;
    expect(isInvalidated(firstPageKey)).toBe(true);
    expect(isInvalidated(searchedKey)).toBe(true);
    expect(isInvalidated(detailKey)).toBe(false);
  });
});

describe("hotelQueryKey", () => {
  it("생성된 상세 쿼리 키를 쓴다", () => {
    expect(hotelQueryKey(HOTEL_ID)).toEqual(
      generated.getGetHotelQueryKey(HOTEL_ID),
    );
  });
});

describe("fetchHotel", () => {
  it("호텔 ID와 signal을 넘겨 호텔을 돌려준다", async () => {
    vi.mocked(generated.getHotel).mockResolvedValue(HOTEL_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchHotel(HOTEL_ID, { signal })).resolves.toEqual(HOTEL);
    expect(generated.getHotel).toHaveBeenCalledWith(
      HOTEL_ID,
      undefined,
      signal,
    );
  });

  it.each([Number.NaN, 1.5])(
    "호텔 ID가 %s면 요청을 보내지 않고 요청 검증 오류를 던진다",
    async (hotelId) => {
      await expect(fetchHotel(hotelId)).rejects.toBeInstanceOf(
        RequestValidationError,
      );
      expect(generated.getHotel).not.toHaveBeenCalled();
    },
  );
});

describe("createHotel", () => {
  it("검증한 본문을 보내고 등록한 호텔과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.createHotel).mockResolvedValue(CREATED_HOTEL_RESPONSE);

    await expect(createHotel(CREATE_BODY)).resolves.toEqual({
      data: HOTEL,
      message: CREATE_MESSAGE,
    });
    expect(generated.createHotel).toHaveBeenCalledWith(CREATE_BODY);
  });

  it("본문에 스키마에 없는 필드가 있으면 버리고 보낸다", async () => {
    vi.mocked(generated.createHotel).mockResolvedValue(CREATED_HOTEL_RESPONSE);
    const bodyWithExtraFields = {
      ...CREATE_BODY,
      extra: true,
      master: { ...CREATE_BODY.master, extra: true },
    };

    await createHotel(bodyWithExtraFields);

    expect(generated.createHotel).toHaveBeenCalledWith(CREATE_BODY);
  });

  it.each([
    ["전화번호 형식이 틀리면", { ...CREATE_BODY, phone: "02-123" }],
    [
      "마스터 비밀번호에 숫자가 없으면",
      {
        ...CREATE_BODY,
        master: { ...CREATE_BODY.master, password: "password" },
      },
    ],
    [
      "소개가 1000자를 넘으면",
      { ...CREATE_BODY, description: "a".repeat(1001) },
    ],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, body) => {
    await expect(createHotel(body)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.createHotel).not.toHaveBeenCalled();
  });
});

describe("updateHotel", () => {
  it("호텔 ID와 검증한 본문을 보내고 수정한 호텔과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateHotel).mockResolvedValue(UPDATED_HOTEL_RESPONSE);

    await expect(updateHotel(HOTEL_ID, UPDATE_BODY)).resolves.toEqual({
      data: HOTEL,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateHotel).toHaveBeenCalledWith(HOTEL_ID, UPDATE_BODY);
  });

  it.each([
    ["호텔 ID가 정수가 아니면", Number.NaN, UPDATE_BODY],
    [
      "version이 정수가 아니면",
      HOTEL_ID,
      { ...UPDATE_BODY, version: 0.5 },
    ],
  ])(
    "%s 요청을 보내지 않고 요청 검증 오류를 던진다",
    async (_, hotelId, body) => {
      await expect(updateHotel(hotelId, body)).rejects.toBeInstanceOf(
        RequestValidationError,
      );
      expect(generated.updateHotel).not.toHaveBeenCalled();
    },
  );
});

describe.each(HOTEL_OPERATIONS)(
  "$name 응답 검증",
  ({ response, mockResponse, run, toResult }) => {
    it.each(UNSUCCESSFUL_RESPONSE_OVERRIDES)(
      "성공 응답의 %s면 응답 검증 오류를 던진다",
      async (_, override) => {
        mockResponse({ ...response, ...override });

        await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
      },
    );

    it.each(INVALID_HOTELS)(
      "응답의 %s 응답 검증 오류를 던진다",
      async (_, hotel) => {
        mockResponse({ ...response, data: hotel });

        await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
      },
    );

    it("응답에 스키마에 없는 필드가 있으면 버린다", async () => {
      mockResponse({ ...response, data: HOTEL_WITH_EXTRA_FIELD });

      await expect(run()).resolves.toEqual(toResult(HOTEL));
    });
  },
);

describe.each(HOTEL_CHANGE_OPERATIONS)(
  "$name 성공 문구 검증",
  ({ response, mockResponse, run }) => {
    it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
      mockResponse({ ...response, message: null });

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });
  },
);
