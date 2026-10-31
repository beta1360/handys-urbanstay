import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  createRoom,
  fetchRoom,
  fetchRooms,
  roomListQueryKey,
  roomQueryKey,
  updateRoom,
  updateRoomStatus,
} from "./room";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getRooms: vi.fn(),
  getRoom: vi.fn(),
  createRoom: vi.fn(),
  updateRoom: vi.fn(),
  updateRoomStatus: vi.fn(),
}));

const ROOM_ID = 1;

const ROOM = {
  id: ROOM_ID,
  name: "101",
  type: "스탠다드",
  capacity: 2,
  floor: null,
  description: null,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  status: "VACANT",
  version: 0,
} as const;

const ROOM_WITH_EXTRA_FIELD = { ...ROOM, createdAt: "2026-10-30T00:00:00Z" };

const ROOM_RESPONSE = {
  success: true,
  data: ROOM,
  message: null,
  error: null,
};

const CREATE_MESSAGE = "객실을 등록했습니다.";

const UPDATE_MESSAGE = "객실 정보를 수정했습니다.";

const STATUS_MESSAGE = "객실 상태를 바꿨습니다.";

const ROOM_PAGE = {
  items: [ROOM],
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
};

const ROOM_PAGE_RESPONSE = {
  success: true,
  data: ROOM_PAGE,
  message: null,
  error: null,
};

const LIST_PARAMS = { keyword: "10", status: "VACANT", page: 1, size: 10 } as const;

const CREATE_BODY = {
  name: ROOM.name,
  type: ROOM.type,
  capacity: ROOM.capacity,
  floor: 1,
  description: null,
  checkInTime: ROOM.checkInTime,
  checkOutTime: ROOM.checkOutTime,
};

const UPDATE_BODY = { ...CREATE_BODY, version: ROOM.version };

const STATUS_BODY = { from: "VACANT", to: "RESERVED" } as const;

const ROOM_CHANGE_OPERATIONS = [
  {
    name: "createRoom",
    response: { ...ROOM_RESPONSE, message: CREATE_MESSAGE },
    mockResponse: (response: unknown) =>
      vi.mocked(generated.createRoom).mockResolvedValue(response as never),
    run: () => createRoom(CREATE_BODY),
    toResult: (room: unknown) => ({ data: room, message: CREATE_MESSAGE }),
  },
  {
    name: "updateRoom",
    response: { ...ROOM_RESPONSE, message: UPDATE_MESSAGE },
    mockResponse: (response: unknown) =>
      vi.mocked(generated.updateRoom).mockResolvedValue(response as never),
    run: () => updateRoom(ROOM_ID, UPDATE_BODY),
    toResult: (room: unknown) => ({ data: room, message: UPDATE_MESSAGE }),
  },
  {
    name: "updateRoomStatus",
    response: { ...ROOM_RESPONSE, message: STATUS_MESSAGE },
    mockResponse: (response: unknown) =>
      vi
        .mocked(generated.updateRoomStatus)
        .mockResolvedValue(response as never),
    run: () => updateRoomStatus(ROOM_ID, STATUS_BODY),
    toResult: (room: unknown) => ({ data: room, message: STATUS_MESSAGE }),
  },
];

const ROOM_OPERATIONS = [
  {
    name: "fetchRoom",
    response: ROOM_RESPONSE,
    mockResponse: (response: unknown) =>
      vi.mocked(generated.getRoom).mockResolvedValue(response as never),
    run: () => fetchRoom(ROOM_ID),
    toResult: (room: unknown) => room,
  },
  ...ROOM_CHANGE_OPERATIONS,
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchRooms", () => {
  it("검색어·상태·페이지와 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getRooms).mockResolvedValue(ROOM_PAGE_RESPONSE);
    const { signal } = new AbortController();

    await expect(fetchRooms(LIST_PARAMS, { signal })).resolves.toEqual(
      ROOM_PAGE,
    );
    expect(generated.getRooms).toHaveBeenCalledWith(
      LIST_PARAMS,
      undefined,
      signal,
    );
  });

  it.each([
    ["page가 범위를 넘으면", { page: 100 }],
    ["status가 정해진 값이 아니면", { status: "vacant" }],
  ])("%s 요청을 보내지 않고 요청 검증 오류를 던진다", async (_, params) => {
    await expect(fetchRooms(params as never)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getRooms).not.toHaveBeenCalled();
  });

  it("응답 항목의 상태가 정해진 값이 아니면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getRooms).mockResolvedValue({
      ...ROOM_PAGE_RESPONSE,
      data: { ...ROOM_PAGE, items: [{ ...ROOM, status: "CLEANING" }] },
    } as never);

    await expect(fetchRooms(LIST_PARAMS)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("roomListQueryKey", () => {
  it("파라미터 없이 만들면 모든 목록 쿼리를 가리키고 상세 쿼리는 가리키지 않는다", async () => {
    const queryClient = new QueryClient();
    const firstPageKey = roomListQueryKey({});
    const searchedKey = roomListQueryKey(LIST_PARAMS);
    const detailKey = roomQueryKey(ROOM_ID);
    queryClient.setQueryData(firstPageKey, ROOM_PAGE);
    queryClient.setQueryData(searchedKey, ROOM_PAGE);
    queryClient.setQueryData(detailKey, ROOM);

    await queryClient.invalidateQueries({ queryKey: roomListQueryKey() });

    const isInvalidated = (queryKey: readonly unknown[]) =>
      queryClient.getQueryState(queryKey)?.isInvalidated;
    expect(isInvalidated(firstPageKey)).toBe(true);
    expect(isInvalidated(searchedKey)).toBe(true);
    expect(isInvalidated(detailKey)).toBe(false);
  });
});

describe("updateRoom", () => {
  it("객실 ID와 검증한 본문을 보내고 수정한 객실과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateRoom).mockResolvedValue({
      ...ROOM_RESPONSE,
      message: UPDATE_MESSAGE,
    });

    await expect(updateRoom(ROOM_ID, UPDATE_BODY)).resolves.toEqual({
      data: ROOM,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateRoom).toHaveBeenCalledWith(ROOM_ID, UPDATE_BODY);
  });

  it("체크인 시각이 HH:mm 형식이 아니면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      updateRoom(ROOM_ID, { ...UPDATE_BODY, checkInTime: "15:00:00" }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.updateRoom).not.toHaveBeenCalled();
  });
});

describe("updateRoomStatus", () => {
  it("객실 ID와 화면에서 본 상태·바꿀 상태를 보내고 바뀐 객실과 성공 문구를 돌려준다", async () => {
    const changedRoom = { ...ROOM, status: STATUS_BODY.to };
    vi.mocked(generated.updateRoomStatus).mockResolvedValue({
      ...ROOM_RESPONSE,
      data: changedRoom,
      message: STATUS_MESSAGE,
    });

    await expect(updateRoomStatus(ROOM_ID, STATUS_BODY)).resolves.toEqual({
      data: changedRoom,
      message: STATUS_MESSAGE,
    });
    expect(generated.updateRoomStatus).toHaveBeenCalledWith(
      ROOM_ID,
      STATUS_BODY,
    );
  });

  it("바꿀 상태가 정해진 값이 아니면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      updateRoomStatus(ROOM_ID, { ...STATUS_BODY, to: "vacant" } as never),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.updateRoomStatus).not.toHaveBeenCalled();
  });
});

describe.each(ROOM_OPERATIONS)(
  "$name 응답 검증",
  ({ response, mockResponse, run, toResult }) => {
    it.each([
      ["success가 false", { success: false }],
      ["data가 null", { data: null }],
      ["data의 필드가 빠짐", { data: { ...ROOM, version: undefined } }],
    ])("성공 응답의 %s면 응답 검증 오류를 던진다", async (_, override) => {
      mockResponse({ ...response, ...override });

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });

    it("응답에 스키마에 없는 필드가 있으면 버린다", async () => {
      mockResponse({ ...response, data: ROOM_WITH_EXTRA_FIELD });

      await expect(run()).resolves.toEqual(toResult(ROOM));
    });
  },
);

describe.each(ROOM_CHANGE_OPERATIONS)(
  "$name 성공 문구 검증",
  ({ response, mockResponse, run }) => {
    it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
      mockResponse({ ...response, message: null });

      await expect(run()).rejects.toBeInstanceOf(ResponseValidationError);
    });
  },
);
