import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  createRoomType,
  fetchRoomTypes,
  updateRoomType,
} from "./room-type";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getRoomTypes: vi.fn(),
  createRoomType: vi.fn(),
  updateRoomType: vi.fn(),
}));

const ROOM_TYPE = {
  id: 1,
  name: "스탠다드",
  capacity: 2,
  roomRate: 100000,
  checkInTime: "15:00",
  checkOutTime: "11:00",
  version: 0,
};

const CREATE_BODY = {
  name: ROOM_TYPE.name,
  capacity: ROOM_TYPE.capacity,
  roomRate: ROOM_TYPE.roomRate,
  checkInTime: ROOM_TYPE.checkInTime,
  checkOutTime: ROOM_TYPE.checkOutTime,
};

const CREATE_MESSAGE = "객실 유형을 생성했습니다.";

const UPDATE_MESSAGE = "객실 유형을 수정했습니다.";

function successResponse(data: unknown, message: string | null = null) {
  return { success: true, data, message, error: null };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("fetchRoomTypes", () => {
  it("signal을 넘겨 유형 목록을 그대로 돌려준다", async () => {
    vi.mocked(generated.getRoomTypes).mockResolvedValue(
      successResponse([ROOM_TYPE]) as never,
    );
    const { signal } = new AbortController();

    await expect(fetchRoomTypes({ signal })).resolves.toEqual([ROOM_TYPE]);
    expect(generated.getRoomTypes).toHaveBeenCalledWith(undefined, signal);
  });

  it("유형의 체크인 시각이 HH:mm 형식이 아니면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getRoomTypes).mockResolvedValue(
      successResponse([{ ...ROOM_TYPE, checkInTime: "15:00:00" }]) as never,
    );

    await expect(fetchRoomTypes()).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("createRoomType", () => {
  it("검증한 본문을 보내고 만든 유형과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.createRoomType).mockResolvedValue(
      successResponse(ROOM_TYPE, CREATE_MESSAGE) as never,
    );

    await expect(createRoomType(CREATE_BODY)).resolves.toEqual({
      data: ROOM_TYPE,
      message: CREATE_MESSAGE,
    });
    expect(generated.createRoomType).toHaveBeenCalledWith(CREATE_BODY);
  });

  it("1박 요금이 범위를 넘으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(
      createRoomType({ ...CREATE_BODY, roomRate: 10000001 }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.createRoomType).not.toHaveBeenCalled();
  });
});

describe("updateRoomType", () => {
  it("유형 ID와 version을 담은 본문을 보내고 수정한 유형과 성공 문구를 돌려준다", async () => {
    const body = { ...CREATE_BODY, version: ROOM_TYPE.version };
    vi.mocked(generated.updateRoomType).mockResolvedValue(
      successResponse(ROOM_TYPE, UPDATE_MESSAGE) as never,
    );

    await expect(updateRoomType(ROOM_TYPE.id, body)).resolves.toEqual({
      data: ROOM_TYPE,
      message: UPDATE_MESSAGE,
    });
    expect(generated.updateRoomType).toHaveBeenCalledWith(ROOM_TYPE.id, body);
  });
});
