import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RequestValidationError,
  ResponseValidationError,
} from "@repo/admin-kit/api";
import {
  adminListQueryKey,
  adminQueryKey,
  createAdmin,
  fetchAdmin,
  fetchAdmins,
  updateAdmin,
} from "./admin";
import * as generated from "./generated";
import {
  getAdminsQueryPageDefault,
  getAdminsQuerySizeDefault,
} from "./generated/zod";

vi.mock("./generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./generated")>()),
  getAdmins: vi.fn(),
  getAdmin: vi.fn(),
  createAdmin: vi.fn(),
  updateAdmin: vi.fn(),
}));

const ADMIN_ID = 2;

const ADMIN_SUMMARY = {
  id: ADMIN_ID,
  loginId: "admin2@urbanstay.com",
  name: "김어드민",
  createdAt: "2026-10-30T06:59:32.123456Z",
};

const ADMIN = { ...ADMIN_SUMMARY, version: 1 };

const MESSAGE = "서버 성공 문구";

function toPage<T>(items: T[]) {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: 1 };
}

function toResponse<T>(data: T, message: string | null = null) {
  return { success: true, data, message, error: null };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("fetchAdmins", () => {
  it("빠진 page·size는 기본값을 채우고 signal을 넘겨 목록 페이지를 돌려준다", async () => {
    vi.mocked(generated.getAdmins).mockResolvedValue(
      toResponse(toPage([ADMIN_SUMMARY])),
    );
    const { signal } = new AbortController();

    await expect(fetchAdmins({}, { signal })).resolves.toEqual(
      toPage([ADMIN_SUMMARY]),
    );
    expect(generated.getAdmins).toHaveBeenCalledWith(
      { page: getAdminsQueryPageDefault, size: getAdminsQuerySizeDefault },
      undefined,
      signal,
    );
  });

  it("page가 범위를 넘으면 요청을 보내지 않고 요청 검증 오류를 던진다", async () => {
    await expect(fetchAdmins({ page: 100 })).rejects.toBeInstanceOf(
      RequestValidationError,
    );
    expect(generated.getAdmins).not.toHaveBeenCalled();
  });
});

describe("fetchAdmin", () => {
  it("계정 ID와 signal을 넘겨 version이 있는 계정을 돌려준다", async () => {
    vi.mocked(generated.getAdmin).mockResolvedValue(toResponse(ADMIN));
    const { signal } = new AbortController();

    await expect(fetchAdmin(ADMIN_ID, { signal })).resolves.toEqual(ADMIN);
    expect(generated.getAdmin).toHaveBeenCalledWith(ADMIN_ID, undefined, signal);
  });

  it("version이 빠지면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.getAdmin).mockResolvedValue(
      toResponse(ADMIN_SUMMARY) as never,
    );

    await expect(fetchAdmin(ADMIN_ID)).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });
});

describe("createAdmin", () => {
  it("검증한 본문을 보내고 추가한 계정과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.createAdmin).mockResolvedValue(
      toResponse(ADMIN, MESSAGE),
    );
    const body = {
      loginId: ADMIN.loginId,
      name: ADMIN.name,
      password: "urbanstay123!",
    };

    await expect(createAdmin(body)).resolves.toEqual({
      data: ADMIN,
      message: MESSAGE,
    });
    expect(generated.createAdmin).toHaveBeenCalledWith(body);
  });

  it("비밀번호가 규칙에 맞지 않으면 요청을 보내지 않는다", async () => {
    await expect(
      createAdmin({
        loginId: ADMIN.loginId,
        name: ADMIN.name,
        password: "short",
      }),
    ).rejects.toBeInstanceOf(RequestValidationError);
    expect(generated.createAdmin).not.toHaveBeenCalled();
  });
});

describe("updateAdmin", () => {
  it("계정 ID와 이름·version을 보내고 수정한 계정과 성공 문구를 돌려준다", async () => {
    vi.mocked(generated.updateAdmin).mockResolvedValue(
      toResponse(ADMIN, MESSAGE),
    );
    const body = { name: ADMIN.name, version: 0 };

    await expect(updateAdmin(ADMIN_ID, body)).resolves.toEqual({
      data: ADMIN,
      message: MESSAGE,
    });
    expect(generated.updateAdmin).toHaveBeenCalledWith(ADMIN_ID, body);
  });

  it("성공 응답의 message가 null이면 응답 검증 오류를 던진다", async () => {
    vi.mocked(generated.updateAdmin).mockResolvedValue(toResponse(ADMIN));

    await expect(
      updateAdmin(ADMIN_ID, { name: ADMIN.name, version: 0 }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });
});

describe("어드민 계정 쿼리 키", () => {
  it("요청 경로를 따르고 파라미터 없는 목록 키는 상세 키를 가리키지 않는다", () => {
    expect(adminListQueryKey()).toEqual(["/api/v1/app-admin/admins"]);
    expect(adminListQueryKey({ page: 1 })).toEqual([
      "/api/v1/app-admin/admins",
      { page: 1 },
    ]);
    expect(adminQueryKey(ADMIN_ID)).toEqual([
      `/api/v1/app-admin/admins/${ADMIN_ID}`,
    ]);
  });
});
